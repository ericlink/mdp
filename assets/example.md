# example markdown

## markdown
- markdown
- styles

## tables
column | column | column
:--: | :--: | :--:
1|2|3
4|5|6

## highlight.js

```javascript
function handler(data,err) {
	if (data) console.log(data);
	if (err) console.log(err);
}
```
## open links in default browser

[https://github.com/ericlink/mdp](https://github.com/ericlink/mdp)

[http://github.com/ericlink/mdp](http://github.com/ericlink/mdp)

## mermaid

[mermaid doc](https://mermaidjs.github.io/flowchart.html)

```mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts<br/>prevail...
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
```

```mermaid
sequenceDiagram
	A->>B ƛ: do something
	A->>B ƛ: do something else
	B->>N: Fire an Event
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
