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
