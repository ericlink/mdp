param(
  [Parameter(Mandatory = $true)][string]$ShortcutPath,
  [Parameter(Mandatory = $true)][string]$TargetPath,
  [Parameter(Mandatory = $true)][string]$WorkingDirectory,
  [Parameter(Mandatory = $true)][string]$IconLocation,
  [Parameter(Mandatory = $true)][string]$AppUserModelId
)

$ErrorActionPreference = 'Stop'

$shortcutDir = Split-Path -Parent $ShortcutPath
if (-not (Test-Path $shortcutDir)) {
  New-Item -ItemType Directory -Path $shortcutDir -Force | Out-Null
}

$tempShortcutPath = Join-Path $env:TEMP ("mdp-" + [Guid]::NewGuid().ToString() + ".lnk")

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($tempShortcutPath)
$shortcut.TargetPath = $TargetPath
$shortcut.WorkingDirectory = $WorkingDirectory
$shortcut.WindowStyle = 1
$shortcut.Description = 'mdp'
$shortcut.IconLocation = $IconLocation
$shortcut.Save()
[System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($shortcut) | Out-Null
[System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($shell) | Out-Null
[GC]::Collect()
[GC]::WaitForPendingFinalizers()
Start-Sleep -Milliseconds 200

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;

namespace MdpShortcut {
  [ComImport, Guid("00021401-0000-0000-C000-000000000046")]
  public class CShellLink {}

  [ComImport, InterfaceType(ComInterfaceType.InterfaceIsIUnknown), Guid("000214F9-0000-0000-C000-000000000046")]
  public interface IShellLinkW {}

  [StructLayout(LayoutKind.Sequential, Pack = 4)]
  public struct PropertyKey {
    public Guid fmtid;
    public UInt32 pid;
    public PropertyKey(Guid fmtid, UInt32 pid) {
      this.fmtid = fmtid;
      this.pid = pid;
    }
  }

  [StructLayout(LayoutKind.Sequential)]
  public sealed class PropVariant : IDisposable {
    ushort vt;
    ushort wReserved1;
    ushort wReserved2;
    ushort wReserved3;
    IntPtr pointerValue;
    public PropVariant(string value) {
      vt = 31;
      pointerValue = Marshal.StringToCoTaskMemUni(value);
    }
    public void Dispose() {
      PropVariantClear(this);
      GC.SuppressFinalize(this);
    }
    [DllImport("ole32.dll")]
    private static extern int PropVariantClear([In, Out] PropVariant pvar);
  }

  [ComImport, InterfaceType(ComInterfaceType.InterfaceIsIUnknown), Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99")]
  public interface IPropertyStore {
    uint GetCount(out uint cProps);
    uint GetAt(uint iProp, out PropertyKey pkey);
    uint GetValue(ref PropertyKey key, [Out] PropVariant pv);
    uint SetValue(ref PropertyKey key, [In] PropVariant pv);
    uint Commit();
  }

  public static class AppUserModel {
    public static void SetId(string shortcutPath, string appId) {
      IShellLinkW link = (IShellLinkW)new CShellLink();
      IPersistFile file = (IPersistFile)link;
      file.Load(shortcutPath, 0);
      IPropertyStore store = (IPropertyStore)link;
      PropertyKey key = new PropertyKey(new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"), 5);
      using (PropVariant value = new PropVariant(appId)) {
        store.SetValue(ref key, value);
        store.Commit();
      }
      file.Save(shortcutPath, true);
    }
  }
}
"@

try {
  [MdpShortcut.AppUserModel]::SetId($tempShortcutPath, $AppUserModelId)
} catch {
  Write-Host "Warning: could not set AppUserModelId on shortcut: $($_.Exception.Message)"
}

Copy-Item -Path $tempShortcutPath -Destination $ShortcutPath -Force
Remove-Item -Path $tempShortcutPath -Force -ErrorAction SilentlyContinue
