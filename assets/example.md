# example markdown

## markdown
- github flavored markdown
- styles *italic* **bold** ~~cross through~~

## tables
column | column | column
:--: | :--: | :--:
1|2|3
4|5|6

## images
![app.png](app.png)

## highlight.js

```javascript
function handler(data,err) {
	if (data) console.log(data);
	if (err) console.log(err);
}
```
## emoji
:+1: :coffee: :pizza: :beer:
## open links in default browser
[https://ericlink.github.io/mdp/](https://ericlink.github.io/mdp/)

[http://ericlink.github.io/mdp/](https://ericlink.github.io/mdp/)

[https://github.com/ericlink/mdp](https://github.com/ericlink/mdp)

[http://github.com/ericlink/mdp](http://github.com/ericlink/mdp)

## mermaid

[mermaid doc](https://mermaidjs.github.io/flowchart.html)
```mermaid
sequenceDiagram
	A->>B ƛ: do something
	A->>B ƛ: do something else
	B->>N: Fire an Event
```

```mermaid
sequenceDiagram
    participant a as Alice
    participant j as John
    participant b as Bob
    loop Healthcheck
        j->>j: loop with j
    end
    j->>j: j message j
    a->>j: Hello John, how are you?
    j->>a: Great!
    alt if john answers
        a->>j: Great!
    else if john doesn't answer
        a->>b: Is that you Bob?
    end
    a-->j: dotted
    a-->>j: dotted arrow
    note right of j: here is the note <br>right j
    note left of a: here is the note left a
    note right of a: here is the note <br>right a
    note over a,j: aj note
```

```mermaid
graph LR
    A[Square Rect] -- Link text --> B((Circle))
    A --> C(Round Rect)
    B --> D{Rhombus}
    C --> D
```

```mermaid
graph TD
    A((Start)) --> B((Stop))
```

```mermaid
graph TD
A[Christmas] -->|Get money| B(Go shopping)
B --> C{Let me think}
C -->|One| D[Laptop]
C -->|Two| E[iPhone]
C -->|Three| F[fa:fa-car Car]
```

```mermaid
gitGraph:
options
{
    "nodeSpacing": 150,
    "nodeRadius": 10
}
end
commit
branch newbranch
checkout newbranch
commit
commit
checkout master
commit
commit
merge newbranch
```

```mermaid
gantt
dateFormat  YYYY-MM-DD
title Adding GANTT diagram to mermaid
section A section
Completed task            :done,    des1, 2014-01-06,2014-01-08
Active task               :active,  des2, 2014-01-09, 3d
Future task               :         des3, after des2, 5d
Future task2               :         des4, after des3, 5d
```

```mermaid
classDiagram
	Class01 <|-- AveryLongClass : Cool
	Class03 *-- Class04
	Class05 o-- Class06
	Class07 .. Class08
	Class09 --> C2 : Where am i?
	Class09 --* C3
	Class09 --|> Class07
	Class07 : equals()
	Class07 : Object[] elementData
	Class01 : size()
	Class01 : int chimp
	Class01 : int gorilla
	Class08 <--> C2: Cool label
```

```mermaid
stateDiagram
	[*] --> Still
	Still --> [*]

	Still --> Moving
	Moving --> Still
	Moving --> Crash
	Crash --> [*]
```

```mermaid
erDiagram
        CUSTOMER }|..|{ DELIVERY-ADDRESS : has
        CUSTOMER ||--o{ ORDER : places
        CUSTOMER ||--o{ INVOICE : "liable for"
        DELIVERY-ADDRESS ||--o{ ORDER : receives
        INVOICE ||--|{ ORDER : covers
        ORDER ||--|{ ORDER-ITEM : includes
        PRODUCT-CATEGORY ||--|{ PRODUCT : contains
        PRODUCT ||--o{ ORDER-ITEM : "ordered in"
```


```mermaid
pie title Pets adopted by volunteers
	"Dogs" : 386
	"Cats" : 85
	"Rats" : 15
```
