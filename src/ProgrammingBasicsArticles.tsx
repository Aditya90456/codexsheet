import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Clock3, Code2, GraduationCap, Lightbulb, List, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { lessons, tracks, type Lesson, type Track } from "./ProgrammingBasicsCourse";

type Article = { mentalModel: string; walkthrough: string[]; mistakes: string[]; practice: string[]; takeaway: string };

const articles: Record<string, Article> = {
  "first-program": { mentalModel: "Treat a program like a small recipe. The runtime begins at a known starting point, follows instructions in order, and produces observable output. A successful first program proves the toolchain is ready; from here, every new idea is another instruction you can compose.", walkthrough: ["Python executes the file from its first line. `print` is a built-in function, and parentheses hold the value passed to it.", "Java starts at `main`, the method the runtime knows how to call. `System.out.println` writes text and then ends that line.", "C++ also begins in `main`. `std::cout` is the standard output stream; `<<` sends text into it, and `\\n` moves to a fresh line."], mistakes: ["In Java, the public class name must match the file name in many beginner runners; use `Main` when the runner expects it.", "In C++, include the header that declares the library feature you use. `iostream` provides `cout`.", "Text must be inside matching quotation marks. A missing quote prevents the program from compiling or parsing."], practice: ["Print your name and your city on separate lines.", "Print a three-line introduction. Predict the exact output before running it.", "Change the message to include punctuation and a number."], takeaway: "Every program starts somewhere. Find the entry point, follow the statements in order, and inspect the output." },
  "values-and-variables": { mentalModel: "A variable is a named place in your program's working memory. Its name should describe the role of the value, while its type describes what kind of value it holds. Assignment stores a value; later expressions can read and combine it.", walkthrough: ["`name` refers to text, while `solved` refers to a whole number. The print statement combines those values into one readable sentence.", "Python binds a name to a value directly. The interpreter determines the type from the value, so `3` is an integer and `\"Mira\"` is text.", "Java declares a type beside each variable. `String` holds text and `int` holds a whole number; the compiler can catch many mismatches before the program runs.", "C++ uses the same explicit declarations here. `std::string` is the standard text type and requires the `<string>` header."], mistakes: ["Choose names that say what a value means; `solvedCount` carries more information than `x`.", "In Java and C++, `=` assigns. To compare two values later, use `==`.", "Text and numbers are different types. Convert deliberately when you need arithmetic on input text."], practice: ["Store a product name, its price, and the number of items in three variables.", "Calculate the total cost in a new variable and print a complete sentence.", "Predict what changes if you update the quantity before calculating the total."], takeaway: "Give values clear names, choose the type that matches their role, and make data flow visible." },
  "read-input": { mentalModel: "Input is the boundary between a program and the outside world. The program reads a representation of a value, converts it into the kind of data it needs, and then performs its normal work. Keeping those steps separate makes bugs easier to locate.", walkthrough: ["The example reads one line from standard input. The sample input is `18`; after conversion, the program adds one and prints `19`.", "Python's `input()` returns text, so `int(...)` converts a whole-number answer before addition.", "Java creates a `Scanner` connected to `System.in`. `nextInt()` reads and parses the next integer token.", "C++ declares an integer and uses `std::cin >> age` to extract a number from standard input. The extraction operator skips leading whitespace."], mistakes: ["Adding `1` to a string may join text or fail; convert input before doing number arithmetic.", "Read the right number of values. A program that expects two numbers needs two input values.", "Text input can be empty or invalid in real applications. Later, learn to validate before relying on it."], practice: ["Read a whole number and print its double.", "Read a first name and print a greeting. Notice that text input uses a different type or method than numeric input.", "Read two numbers and print their sum. Write down which line supplies each value."], takeaway: "Read, convert, validate, then calculate. This order keeps input handling understandable." },
  conditions: { mentalModel: "A condition turns a question into a boolean value: true or false. Branches let a program choose a path based on that result. Read a conditional as a sentence, and check each boundary value to confirm the rule matches the task.", walkthrough: ["The input score is compared with 50. If the comparison is true, the first block prints `Pass`; otherwise the `else` block prints the alternate message.", "`>=` includes the boundary itself. A score of exactly 50 passes, while 49 does not.", "Braces mark the Java and C++ blocks. Python uses indentation to show which statements belong to each branch."], mistakes: ["Use `==` to compare values; a single `=` stores a value.", "Check whether the boundary should be inclusive. `>` and `>=` answer different questions.", "For three outcomes, use an `else if` / `elif` chain or handle zero separately so cases do not overlap."], practice: ["Classify a number as positive, negative, or zero.", "Convert a percentage to a letter grade using ordered ranges.", "Test exactly at each cutoff, just below it, and just above it."], takeaway: "A branch is only as correct as its condition. State the rule in plain language, then test its edges." },
  loops: { mentalModel: "A loop is controlled repetition. Each pass has a current value and makes progress toward an end condition. A running total is an accumulator: initialize it before the loop, update it each pass, and read the final value afterward.", walkthrough: ["The accumulator begins at zero because no values have been added yet.", "The loop visits the integers 1, 2, 3, 4, and 5. Each value is added to `total` once.", "After the last iteration, the accumulator contains 15. The print statement runs after the loop and displays that finished result.", "Python's `range(1, 6)` includes 1 and stops before 6. Java and C++ use a condition `number <= 5`, so the upper endpoint is included."], mistakes: ["An off-by-one error changes which values the loop visits. Write the first and last iteration down.", "A while loop must change something that can make its condition false, or it may never stop.", "Initialize accumulators before the loop; resetting them inside the loop discards previous work."], practice: ["Change the upper limit to 10 and predict the sum before calculating it.", "Count how many even integers appear from 1 through 20.", "Use a loop to print a countdown from 5 to 1, followed by `Go!`."], takeaway: "For every loop, identify its start, continuation rule, progress step, and result." },
  functions: { mentalModel: "A function is a named unit of work with a clear contract. Its parameters describe the information it needs, and its return value describes what it gives back. A good function can be understood from its name, inputs, and result without rereading the whole program.", walkthrough: ["`square` accepts one number called `number`. That parameter is local to the function call.", "The body multiplies the value by itself and returns the result. Returning is different from printing: a caller can store or reuse a returned value.", "`square(6)` is a call. The argument 6 is passed into the parameter, the function returns 36, and the outer print statement displays it.", "Java marks the result type as `int`; C++ places `int` before the function name. Python does not require a type declaration for this example."], mistakes: ["Printing inside a function is not the same as returning a value. Choose based on whether the caller needs to use the result.", "Match the number and order of arguments to the function's parameters.", "Keep one function focused on one task. Small functions are easier to name, test, and reuse."], practice: ["Write `double_value(number)` and return twice the input.", "Create `larger(a, b)` that returns the larger number.", "Call the function with more than one pair of arguments and explain which part is reused."], takeaway: "Think of functions as input → work → result. Make each part explicit." },
  collections: { mentalModel: "A collection stores related values in one ordered sequence. A loop lets you process each value using the same rule. Indexing commonly starts at zero, but a for-each loop can avoid manual index management when you only need the values.", walkthrough: ["The collection contains 7, 4, and 9. The accumulator starts at zero.", "The loop visits each score in order and adds it to the total. No score is skipped, and each is counted once.", "The final sum is 20. Python uses a list, Java uses an integer array, and C++ uses `std::vector<int>` for a resizable sequence.", "A vector can grow; a fixed-size array has a size chosen when it is created. The best choice depends on whether the number of elements can change."], mistakes: ["An index of 3 is out of range for a three-item collection whose valid indices are 0, 1, and 2.", "Do not change a collection while iterating over it unless you understand how that affects iteration.", "If you only need each value, prefer a for-each loop. Use indices when position itself matters."], practice: ["Add one more score and recalculate the total.", "Find the largest value in the sequence using a running best value.", "Print each item with its index. Explain why the final index is one less than the number of items."], takeaway: "Collections hold the data; loops apply a repeated rule. Keep position and value distinct in your reasoning." },
  "mini-project": { mentalModel: "A useful small program is a pipeline: read inputs, convert them, calculate intermediate values, and present a result. Naming each step makes the arithmetic auditable and makes later changes safer.", walkthrough: ["The first input is a bill amount and the second is a tip percentage. The sample values are 80 and 10.", "The percentage formula is `bill × percent ÷ 100`, which produces a tip of 8.", "The total is the original bill plus the tip: 88. Formatting to two decimal places makes the money output consistent.", "To split the amount among four people, divide the final total by four after adding the tip."], mistakes: ["A percentage must be divided by 100. Multiplying by 10 directly would make a 10% tip ten times too large.", "Use a decimal type for money-like values in introductory examples; remember that real financial systems need decimal arithmetic to avoid floating-point rounding issues.", "Keep the bill, tip percentage, tip amount, and final total in separate variables so each calculation can be checked."], practice: ["Try a bill of 125 with a 12% tip and calculate the expected result by hand.", "Add a third input for the number of people and print the amount each person pays.", "Decide how your program should respond if the bill is negative or the number of people is zero."], takeaway: "Break a real task into named steps, check the arithmetic with a small example, then handle edge cases." },

  // ── OOP ──────────────────────────────────────────────────────────────────
  "oop-classes": {
    mentalModel: "A class is a template. It describes the shape — the fields and the methods — without being any particular thing. When you create an object with 'new' (or by calling the class), you stamp out a live copy of that template. Each object owns its own data but shares the same method code. Think of a class as a form and an object as a filled-in form.",
    walkthrough: [
      "The class declaration names the type and opens the blueprint.",
      "The constructor (`__init__` in Python, the method with the class name in Java/C++) runs once when an object is created. It receives arguments and stores them as fields.",
      "A method is a function defined inside the class. It receives `self` / `this` to access the object's own fields.",
      "Creating two objects from the same class gives two independent copies of the data. Changing one does not affect the other.",
    ],
    mistakes: [
      "Forgetting `self` / `this` when referring to a field inside a method is the most common early error.",
      "Doing work in a method that belongs in the constructor — or the reverse — leads to objects that are half-initialised.",
      "A class name describes a category (Dog, BankAccount); an object name describes one thing (fido, myAccount). Keep the distinction sharp.",
    ],
    practice: [
      "Create a Car class with make, model, and year. Add a describe() method that returns a readable sentence.",
      "Make two Car objects and print them. Verify that changing one does not affect the other.",
      "Add a mileage field that starts at zero and an add_miles(n) method that increases it.",
    ],
    takeaway: "A class defines the shape; an object is the living instance. Each object holds its own data but shares the class's method definitions.",
  },

  "oop-encapsulation": {
    mentalModel: "Encapsulation is the practice of deciding what is private (the object's concern) and what is public (the caller's concern). A well-encapsulated object is a black box: you can trust its state because nobody can reach inside and corrupt it. The public interface is a contract; the private fields are an implementation detail you can change without breaking callers.",
    walkthrough: [
      "The balance field is marked private. Outside code cannot read or write it directly — the object is in full control of its own data.",
      "`deposit` validates the amount before modifying the balance. This is the advantage of a method over direct field access: you can enforce rules.",
      "`getBalance` is a getter — it exposes a read-only view without letting callers change the value.",
      "If the internal representation changes (say, switching from a single float to separate pounds-and-pence integers), callers never know because they only see `deposit` and `getBalance`.",
    ],
    mistakes: [
      "Making all fields public is not encapsulation. Public fields let any code write any value, including invalid ones.",
      "A getter that returns a mutable reference leaks the private state. Return a copy or an immutable view when the field is a collection.",
      "Setters that do no validation are little better than a public field. Add a check or leave the field read-only.",
    ],
    practice: [
      "Add a `withdraw(amount)` method. It should fail silently (or raise an error) when the amount is negative or exceeds the balance.",
      "Add a read-only `is_overdrawn` property that returns True when the balance is below zero.",
      "Explain in one sentence what would go wrong if `balance` were public.",
    ],
    takeaway: "Hide the state; expose the operations. The public interface is a promise; the private fields are a detail only the object needs to know.",
  },

  "oop-inheritance": {
    mentalModel: "Inheritance is code reuse by relationship. The parent class holds what every member of the family has in common. Each child adds or overrides what makes it specific. The rule of thumb is the 'is-a' test: a Dog is an Animal, so Dog can extend Animal. If the relationship is 'has-a', use composition (a field) instead.",
    walkthrough: [
      "The Animal parent defines `name` and a generic `speak()`. All animals have a name; not all speak the same way.",
      "Dog and Cat each extend Animal. The constructor calls `super(name)` to initialise the shared field in the parent.",
      "Both subclasses override `speak()`. The method signature matches the parent, but the body is specific to the type.",
      "A list typed as Animal can hold Dogs and Cats. The loop calls `speak()` on each — the right version runs automatically.",
    ],
    mistakes: [
      "Deep inheritance chains (Animal → Vertebrate → Mammal → Pet → Dog) become hard to understand. Prefer flat hierarchies.",
      "Overriding a method without calling `super` can silently skip important parent logic. Decide deliberately whether the parent's work still applies.",
      "Inheritance is permanent: a subclass is always coupled to its parent. If the relationship is not truly 'is-a', a field (composition) is cleaner.",
    ],
    practice: [
      "Add a Bird class that overrides speak() with a chirp. Create an Animal[] and include a Bird.",
      "Add a move() method to Animal with a default message. Override it in Dog to print 'runs' and in Bird to print 'flies'.",
      "Write down when you would use inheritance versus a field. What question do you ask to decide?",
    ],
    takeaway: "Put shared behaviour in the parent, specific behaviour in the child. Use inheritance when the 'is-a' relationship holds — not just to reuse code.",
  },

  "oop-polymorphism": {
    mentalModel: "Polymorphism means you write the calling code once, against a type, and the right implementation runs at runtime based on what object is actually there. The power is that you can add a new subclass — Triangle, PushNotifier, CryptoPayment — without changing any of the calling code. The calling code never needed to know the exact type.",
    walkthrough: [
      "Shape is the common type. Circle and Rectangle both extend it and both override area().",
      "The list is typed as Shape[], but it holds a Circle and a Rectangle.",
      "The loop calls s.area() on each. The runtime dispatches to Circle.area() for the circle and Rectangle.area() for the rectangle.",
      "Adding a Triangle class requires no change to the loop. The loop already works for any Shape.",
    ],
    mistakes: [
      "Using isinstance() / instanceof inside a loop to call type-specific code defeats the purpose. If you find yourself doing that, an overridden method is the right fix.",
      "In C++, the method must be `virtual` in the parent; without it, the parent's version always runs regardless of the actual type.",
      "Polymorphism only works through a parent-type reference. Calling through the concrete type directly will always hit the same method.",
    ],
    practice: [
      "Add a Triangle class. The area loop should still work without any change.",
      "Create a print_all(shapes) function that prints each shape's name and area. Verify it works for all three types.",
      "Explain in plain language: what does 'runtime dispatch' mean and why is it useful?",
    ],
    takeaway: "Write the calling code against the parent type. Add new behaviour by adding a new subclass — not by modifying the calling code.",
  },

  "oop-abstract": {
    mentalModel: "An abstract class or interface defines a contract: a set of methods that any implementor must provide. The key shift is that the calling code depends only on the contract, not on any specific class. This means you can swap implementations freely — replace EmailNotifier with SMSNotifier, or FileLogger with DatabaseLogger — without touching a single line of the calling code.",
    walkthrough: [
      "Notifier is declared abstract (or as an interface). It defines `send()` but provides no body.",
      "EmailNotifier and SMSNotifier each implement `send()` in their own way.",
      "`alert_all` accepts any Notifier. It does not know and does not care whether it is Email or SMS.",
      "To add a PushNotifier, you write one new class. The alert_all function requires no change.",
    ],
    mistakes: [
      "An abstract class with concrete fields and methods is still useful — it sits between a pure interface and a concrete class. Use abstract classes when subclasses share some implementation.",
      "A class that implements an interface but leaves a method unimplemented will not compile (Java/C++) or will fail at runtime (Python). Every abstract method must be provided.",
      "Interfaces should be narrow. A single method is often better than ten: easier to implement, easier to test, easier to swap.",
    ],
    practice: [
      "Add a PushNotifier that implements the same interface and prints 'Push: <message>'.",
      "Write a test_notifier(n, msg) function that calls n.send(msg). Call it with each of the three notifier types.",
      "Explain the difference between an abstract class and an interface. When would you choose each?",
    ],
    takeaway: "Depend on the contract, not the class. Abstract types let you change implementations without changing the code that uses them.",
  },

  "oop-project": {
    mentalModel: "A real design is a set of objects with clear responsibilities, boundaries, and relationships. The Library does not expose its list; the Book controls its own checked-out state; a future Member class would own its borrowing history. Each class is a black box to the others. That separation is what makes the system easy to change: you can rewrite Book's internals and Library never notices.",
    walkthrough: [
      "Book holds its own state: title, author, and whether it is currently checked out. The _checked_out field is private; only the book's own methods change it.",
      "checkout() enforces the rule that a book cannot be checked out twice. The check lives in the Book, not scattered across callers.",
      "Library owns a list of books but keeps it private. The only way to add a book is through add(). The only way to see the catalogue is through catalogue().",
      "The main program creates a Library, adds Books, and calls methods. It never touches internal fields — every interaction goes through the public interface.",
    ],
    mistakes: [
      "Letting the main program reach into the library's list directly removes the Library's ability to enforce any rules.",
      "Putting all the logic in one giant class is a common first draft. Split it: Book knows about books; Library knows about collections.",
      "Forgetting to handle edge cases in the design (what if a book is not in the library's list when returned?) is better caught early.",
    ],
    practice: [
      "Add a Member class with a name and a list of borrowed books. Add a borrow(book, member) method to Library.",
      "Add a search_by_author(author) method to Library that returns a list of matching books.",
      "Draw the classes as boxes with arrows for relationships. Mark which fields are private and which methods are public.",
    ],
    takeaway: "Real OOP design is about boundaries: what each object owns, what it promises, and what it hides. Keep each class focused on one job.",
  },
};

// ─── Concept diagrams ────────────────────────────────────────────────────────

type DiagramDef = { steps: string[]; render: (step: number) => React.ReactNode };

const diagramDefs: Record<string, DiagramDef> = {
  "first-program": {
    steps: ["Source file on disk", "Runtime finds the entry point", "Instructions run in order", "Output appears on screen"],
    render: (step) => (
      <div className="pb-diagram-flow">
        <div className={`pb-df-node${step >= 0 ? " active" : ""}`}><span className="pb-df-icon">📄</span><strong>source.py</strong><small>your code</small></div>
        <div className={`pb-df-arrow${step >= 1 ? " active" : ""}`}>▼</div>
        <div className={`pb-df-node${step >= 1 ? " active" : ""}`}><span className="pb-df-icon">⚙️</span><strong>Runtime</strong><small>finds main / first line</small></div>
        <div className={`pb-df-arrow${step >= 2 ? " active" : ""}`}>▼</div>
        <div className={`pb-df-node${step >= 2 ? " active" : ""}`}><span className="pb-df-icon">▶</span><strong>Execute</strong><small>line by line, in order</small></div>
        <div className={`pb-df-arrow${step >= 3 ? " active" : ""}`}>▼</div>
        <div className={`pb-df-node${step >= 3 ? " active highlight" : ""}`}><span className="pb-df-icon">🖥️</span><strong>Output</strong><small>Hello, world!</small></div>
      </div>
    ),
  },
  "values-and-variables": {
    steps: ["Declare a variable with a name", "Assign a value to it", "Read the value later", "Combine values in an expression"],
    render: (step) => (
      <div className="pb-diagram-vars">
        <div className="pb-dv-row">
          <div className={`pb-dv-box pb-dv-name${step >= 0 ? " active" : ""}`}><small>NAME</small><strong>score</strong></div>
          <div className="pb-dv-eq">=</div>
          <div className={`pb-dv-box pb-dv-val${step >= 1 ? " active" : ""}`}><small>VALUE</small><strong>42</strong></div>
          <div className={`pb-dv-box pb-dv-type${step >= 1 ? " active" : ""}`}><small>TYPE</small><strong>int</strong></div>
        </div>
        <div className="pb-dv-row">
          <div className={`pb-dv-box pb-dv-name${step >= 0 ? " active" : ""}`}><small>NAME</small><strong>name</strong></div>
          <div className="pb-dv-eq">=</div>
          <div className={`pb-dv-box pb-dv-val${step >= 1 ? " active" : ""}`}><small>VALUE</small><strong>"Mira"</strong></div>
          <div className={`pb-dv-box pb-dv-type${step >= 1 ? " active" : ""}`}><small>TYPE</small><strong>str</strong></div>
        </div>
        <div className={`pb-dv-read${step >= 2 ? " active" : ""}`}><span>READ</span><code>print(name, score)</code></div>
        <div className={`pb-dv-output${step >= 3 ? " active" : ""}`}><span>OUTPUT</span><code>Mira 42</code></div>
      </div>
    ),
  },
  "read-input": {
    steps: ["User types a value", "Program reads raw text", "Convert text to a number", "Use the value in arithmetic"],
    render: (step) => (
      <div className="pb-diagram-input">
        <div className={`pb-di-stage${step === 0 ? " active" : ""}`}><span className="pb-di-label">KEYBOARD</span><div className="pb-di-box"><strong>18</strong><small>user types</small></div></div>
        <div className={`pb-di-arrow${step >= 1 ? " lit" : ""}`}>→</div>
        <div className={`pb-di-stage${step === 1 ? " active" : ""}`}><span className="pb-di-label">RAW TEXT</span><div className="pb-di-box"><strong>"18"</strong><small>string</small></div></div>
        <div className={`pb-di-arrow${step >= 2 ? " lit" : ""}`}>→</div>
        <div className={`pb-di-stage${step === 2 ? " active" : ""}`}><span className="pb-di-label">CONVERT</span><div className="pb-di-box"><strong>int(…)</strong><small>parse</small></div></div>
        <div className={`pb-di-arrow${step >= 3 ? " lit" : ""}`}>→</div>
        <div className={`pb-di-stage${step === 3 ? " active" : ""}`}><span className="pb-di-label">RESULT</span><div className="pb-di-box pb-di-result"><strong>18 + 1 = 19</strong><small>arithmetic</small></div></div>
      </div>
    ),
  },
  conditions: {
    steps: ["Evaluate the condition", "Condition is true → first branch", "Condition is false → else branch", "Only one path runs"],
    render: (step) => (
      <div className="pb-diagram-cond">
        <div className={`pb-dc-cond${step >= 0 ? " active" : ""}`}><span>CONDITION</span><code>score &gt;= 50</code></div>
        <div className="pb-dc-fork">
          <div className={`pb-dc-branch pb-dc-true${step === 1 ? " active" : step >= 2 ? " dim" : ""}`}><span>TRUE</span><code>"Pass"</code></div>
          <div className="pb-dc-sep">|</div>
          <div className={`pb-dc-branch pb-dc-false${step === 2 ? " active" : step === 1 ? " dim" : ""}`}><span>FALSE</span><code>"Try again"</code></div>
        </div>
        <div className={`pb-dc-note${step === 3 ? " active" : ""}`}>Only one branch runs per execution</div>
      </div>
    ),
  },
  loops: {
    steps: ["Accumulator starts at 0", "Loop visits 1 → adds to total", "Loop continues through 2, 3, 4, 5", "Loop ends — total is 15"],
    render: (step) => {
      const nums = [1, 2, 3, 4, 5];
      const totals = [0, 1, 3, 6, 10, 15];
      const active = Math.min(step, 4);
      return (
        <div className="pb-diagram-loop">
          <div className="pb-dl-row">
            {nums.map((n, i) => (
              <div key={n} className={`pb-dl-cell${i < active ? " done" : i === active && step < 4 ? " active" : ""}`}>
                <small>{n}</small>
              </div>
            ))}
          </div>
          <div className="pb-dl-pointer" style={{ left: `${Math.min(active, 4) * 20 + 10}%` }}>▲</div>
          <div className="pb-dl-total">
            <span>TOTAL</span>
            <strong>{totals[step]}</strong>
          </div>
        </div>
      );
    },
  },
  functions: {
    steps: ["Define function with a parameter", "Call the function with an argument", "Body executes with parameter bound", "Return value travels back to caller"],
    render: (step) => (
      <div className="pb-diagram-func">
        <div className={`pb-dfn-def${step >= 0 ? " active" : ""}`}><span>DEFINE</span><code>def square(number):</code></div>
        <div className={`pb-dfn-call${step >= 1 ? " active" : ""}`}><span>CALL</span><code>square(6)</code><small className="pb-dfn-arg">arg: 6</small></div>
        <div className={`pb-dfn-body${step >= 2 ? " active" : ""}`}><span>BODY</span><code>number × number</code><small>6 × 6 = 36</small></div>
        <div className={`pb-dfn-ret${step >= 3 ? " active" : ""}`}><span>RETURN</span><strong>36</strong><small>back to caller</small></div>
      </div>
    ),
  },
  collections: {
    steps: ["Collection holds values in order", "Loop picks up the first item", "Accumulator updates each pass", "All items visited — sum is 20"],
    render: (step) => {
      const items = [7, 4, 9];
      const running = [0, 7, 11, 20];
      return (
        <div className="pb-diagram-coll">
          <div className="pb-dco-list">
            {items.map((v, i) => (
              <div key={v} className={`pb-dco-item${step > 0 && i < step ? " done" : step > 0 && i === step - 1 ? " active" : ""}`}>
                <small>[{i}]</small><strong>{v}</strong>
              </div>
            ))}
          </div>
          <div className="pb-dco-acc">
            <span>TOTAL</span>
            <strong className={step === 3 ? "pb-dco-final" : ""}>{running[Math.min(step, 3)]}</strong>
            <small>{step === 0 ? "init" : step === 3 ? "done" : `+${items[step - 1]}`}</small>
          </div>
        </div>
      );
    },
  },
  "mini-project": {
    steps: ["Read inputs from the user", "Calculate the tip amount", "Add tip to get the total", "Format and print both values"],
    render: (step) => (
      <div className="pb-diagram-pipe">
        <div className={`pb-dp-step${step >= 0 ? " active" : ""}`}><span>INPUT</span><code>bill = 80</code><code>percent = 10</code></div>
        <div className={`pb-dp-arrow${step >= 1 ? " lit" : ""}`}>▼</div>
        <div className={`pb-dp-step${step >= 1 ? " active" : ""}`}><span>CALCULATE TIP</span><code>80 × 10 ÷ 100</code><strong>= 8.00</strong></div>
        <div className={`pb-dp-arrow${step >= 2 ? " lit" : ""}`}>▼</div>
        <div className={`pb-dp-step${step >= 2 ? " active" : ""}`}><span>TOTAL</span><code>80 + 8</code><strong>= 88.00</strong></div>
        <div className={`pb-dp-arrow${step >= 3 ? " lit" : ""}`}>▼</div>
        <div className={`pb-dp-step${step >= 3 ? " active highlight" : ""}`}><span>OUTPUT</span><code>Tip: 8.00</code><code>Total: 88.00</code></div>
      </div>
    ),
  },

  // ── OOP diagrams ──────────────────────────────────────────────────────────
  "oop-classes": {
    steps: ["Class is a blueprint — no data yet", "Constructor stamps out a new object", "Object stores its own fields", "Methods act on the object's data"],
    render: (step) => (
      <div className="pb-diagram-oop-class">
        <div className={`pb-oc-blueprint${step >= 0 ? " active" : ""}`}>
          <span className="pb-oc-label">CLASS · Dog</span>
          <div className="pb-oc-fields"><em>name</em><em>breed</em></div>
          <div className="pb-oc-methods"><em>__init__()</em><em>speak()</em></div>
        </div>
        <div className={`pb-oc-arrow${step >= 1 ? " lit" : ""}`}>
          <span>new Dog("Fido", "Lab")</span>
          <svg viewBox="0 0 60 18" aria-hidden="true"><path d="M2 9h52M44 3l10 6-10 6"/></svg>
        </div>
        <div className="pb-oc-instances">
          <div className={`pb-oc-obj${step >= 2 ? " active" : ""}`}>
            <span className="pb-oc-label">OBJECT · fido</span>
            <div className="pb-oc-slot"><small>name</small><strong>"Fido"</strong></div>
            <div className="pb-oc-slot"><small>breed</small><strong>"Lab"</strong></div>
            <div className={`pb-oc-method-call${step >= 3 ? " active" : ""}`}><small>fido.speak()</small><strong>→ "Fido says Woof!"</strong></div>
          </div>
          <div className={`pb-oc-obj pb-oc-obj-two${step >= 2 ? " active" : ""}`}>
            <span className="pb-oc-label">OBJECT · rex</span>
            <div className="pb-oc-slot"><small>name</small><strong>"Rex"</strong></div>
            <div className="pb-oc-slot"><small>breed</small><strong>"Poodle"</strong></div>
            <div className={`pb-oc-method-call${step >= 3 ? " active" : ""}`}><small>rex.speak()</small><strong>→ "Rex says Woof!"</strong></div>
          </div>
        </div>
      </div>
    ),
  },

  "oop-encapsulation": {
    steps: ["Private field hidden from outside", "Caller uses deposit() — validation runs", "Internal state updates safely", "Getter exposes a read-only view"],
    render: (step) => (
      <div className="pb-diagram-encap">
        <div className="pb-en-outer">
          <span className="pb-en-label">CALLER</span>
          <div className={`pb-en-call${step >= 1 ? " active" : ""}`}><code>acc.deposit(50)</code></div>
          <div className={`pb-en-call${step >= 3 ? " active" : ""}`}><code>acc.getBalance() → 150</code></div>
        </div>
        <div className="pb-en-wall">
          <svg viewBox="0 0 14 100" aria-hidden="true"><rect width="14" height="100" fill="none" stroke="currentColor" strokeDasharray="4 4"/></svg>
        </div>
        <div className="pb-en-inner">
          <span className="pb-en-label">BankAccount</span>
          <div className={`pb-en-private${step >= 0 ? " active" : ""}`}>
            <span>🔒 PRIVATE</span>
            <div className="pb-en-field"><small>_balance</small><strong className={step >= 2 ? "updated" : ""}>{step >= 2 ? "150" : "100"}</strong></div>
          </div>
          <div className={`pb-en-method${step >= 1 ? " active" : ""}`}><code>deposit(amount)</code><small>{step >= 1 ? "if amount &gt; 0 → ok ✓" : "validates amount"}</small></div>
          <div className={`pb-en-method${step >= 3 ? " active" : ""}`}><code>getBalance()</code><small>returns _balance</small></div>
        </div>
      </div>
    ),
  },

  "oop-inheritance": {
    steps: ["Parent holds shared fields & methods", "Child extends the parent", "Child overrides speak()", "Parent-typed list runs the right version"],
    render: (step) => (
      <div className="pb-diagram-inherit">
        <div className={`pb-ih-parent${step >= 0 ? " active" : ""}`}>
          <span className="pb-ih-label">PARENT · Animal</span>
          <div className="pb-ih-row"><em>name</em><em>speak() → "makes a sound"</em></div>
        </div>
        <div className="pb-ih-fork">
          <svg viewBox="0 0 200 38" aria-hidden="true" className={step >= 1 ? "lit" : ""}>
            <path d="M100 2 L100 18 M100 18 L38 18 M100 18 L162 18 M38 18 L38 36 M162 18 L162 36"/>
          </svg>
        </div>
        <div className="pb-ih-children">
          <div className={`pb-ih-child${step >= 1 ? " active" : ""}`}>
            <span className="pb-ih-label">Dog</span>
            <em className={step >= 2 ? "overriding" : ""}>speak() → <strong>"barks"</strong></em>
          </div>
          <div className={`pb-ih-child${step >= 1 ? " active" : ""}`}>
            <span className="pb-ih-label">Cat</span>
            <em className={step >= 2 ? "overriding" : ""}>speak() → <strong>"meows"</strong></em>
          </div>
        </div>
        <div className={`pb-ih-dispatch${step >= 3 ? " active" : ""}`}>
          <code>Animal[] → [Dog, Cat]</code>
          <small>loop calls speak() → correct version runs</small>
        </div>
      </div>
    ),
  },

  "oop-polymorphism": {
    steps: ["One list typed as Shape[]", "Circle.area() dispatched at runtime", "Rectangle.area() dispatched at runtime", "New type fits — no loop change needed"],
    render: (step) => (
      <div className="pb-diagram-poly">
        <div className={`pb-py-list${step >= 0 ? " active" : ""}`}>
          <span className="pb-py-label">shapes : Shape[]</span>
          <div className="pb-py-items">
            <div className={`pb-py-item${step === 1 ? " dispatching" : step > 1 ? " done" : ""}`}><small>Circle(r=5)</small></div>
            <div className={`pb-py-item${step === 2 ? " dispatching" : step > 2 ? " done" : ""}`}><small>Rectangle(4×6)</small></div>
            <div className={`pb-py-item${step === 3 ? " dispatching" : ""}`}><small>Triangle(…)</small></div>
          </div>
        </div>
        <div className="pb-py-dispatch">
          <div className={`pb-py-call${step === 1 ? " active" : ""}`}><code>s.area()</code><strong>→ 78.54</strong><small>Circle</small></div>
          <div className={`pb-py-call${step === 2 ? " active" : ""}`}><code>s.area()</code><strong>→ 24.00</strong><small>Rectangle</small></div>
          <div className={`pb-py-call${step === 3 ? " active" : ""}`}><code>s.area()</code><strong>→ 12.00</strong><small>Triangle (new!)</small></div>
        </div>
        <div className={`pb-py-loop${step >= 0 ? " shown" : ""}`}><code>for s in shapes: print(s.area())</code><small>loop never changes</small></div>
      </div>
    ),
  },

  "oop-abstract": {
    steps: ["Abstract type defines the contract", "Concrete classes implement it", "Caller depends only on the contract", "Swap implementation — caller unchanged"],
    render: (step) => (
      <div className="pb-diagram-abstract">
        <div className={`pb-ab-contract${step >= 0 ? " active" : ""}`}>
          <span className="pb-ab-label">«interface» Notifier</span>
          <code>send(message) — no body</code>
        </div>
        <div className="pb-ab-impl-row">
          <div className={`pb-ab-impl${step >= 1 ? " active" : ""}`}><span>EmailNotifier</span><small>implements send()</small></div>
          <div className={`pb-ab-impl${step >= 1 ? " active" : ""}`}><span>SMSNotifier</span><small>implements send()</small></div>
          <div className={`pb-ab-impl pb-ab-new${step >= 3 ? " active" : ""}`}><span>PushNotifier</span><small>new — no caller change</small></div>
        </div>
        <div className={`pb-ab-caller${step >= 2 ? " active" : ""}`}>
          <span>CALLER · alert_all()</span>
          <code>n.send(msg)</code>
          <small>{step >= 3 ? "works for all three" : "works for Email & SMS"}</small>
        </div>
      </div>
    ),
  },

  "oop-project": {
    steps: ["Book owns its own state", "Library manages the collection", "Encapsulation: private fields, public methods", "Objects collaborate through interfaces"],
    render: (step) => (
      <div className="pb-diagram-oop-proj">
        <div className="pb-proj-classes">
          <div className={`pb-proj-class${step >= 0 ? " active" : ""}`}>
            <span className="pb-proj-label">Book</span>
            <div className="pb-proj-private"><small>🔒 title, author</small><small>🔒 _checked_out</small></div>
            <div className="pb-proj-public"><small>✦ checkout()</small><small>✦ returning()</small><small>✦ status()</small></div>
          </div>
          <div className={`pb-proj-class${step >= 1 ? " active" : ""}`}>
            <span className="pb-proj-label">Library</span>
            <div className="pb-proj-private"><small>🔒 _books[ ]</small></div>
            <div className="pb-proj-public"><small>✦ add(book)</small><small>✦ catalogue()</small></div>
          </div>
        </div>
        <div className={`pb-proj-flow${step >= 2 ? " active" : ""}`}>
          <div className={`pb-proj-step${step === 2 ? " lit" : ""}`}><code>lib.add(book)</code><small>encapsulated</small></div>
          <div className={`pb-proj-step${step === 3 ? " lit" : ""}`}><code>book.checkout()</code><small>→ "Dune checked out"</small></div>
        </div>
        <div className={`pb-proj-rule${step >= 2 ? " active" : ""}`}>
          <small>Each object hides its state · callers use public methods only</small>
        </div>
      </div>
    ),
  },
};

function LessonDiagram({ lessonId }: { lessonId: string }) {
  const def = diagramDefs[lessonId];
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => { setStep(0); setPlaying(true); }, [lessonId]);

  useEffect(() => {
    if (!playing || !def) return;
    const timer = window.setInterval(() => setStep((s) => (s + 1) % def.steps.length), 1500);
    return () => window.clearInterval(timer);
  }, [playing, def]);

  if (!def) return null;

  return (
    <div className="pb-lesson-diagram">
      <div className="pb-ld-top"><span>CONCEPT ANIMATION</span><span>{String(step + 1).padStart(2, "0")} / {String(def.steps.length).padStart(2, "0")}</span></div>
      <div className="pb-ld-stage" aria-label={`Diagram step: ${def.steps[step]}`}>
        {def.render(step)}
      </div>
      <div className="pb-ld-caption"><strong>{def.steps[step]}</strong></div>
      <div className="pb-ld-dots">
        {def.steps.map((label, i) => (
          <button key={label} type="button" className={i === step ? "active" : ""} onClick={() => { setStep(i); setPlaying(false); }} aria-label={`Step ${i + 1}: ${label}`} />
        ))}
      </div>
      <div className="pb-ld-controls">
        <button type="button" onClick={() => setPlaying((p) => !p)}>{playing ? <Pause size={12} /> : <Play size={12} />} {playing ? "Pause" : "Resume"}</button>
        <button type="button" onClick={() => { setStep(0); setPlaying(true); }} aria-label="Restart"><RotateCcw size={12} /></button>
        <span>{playing ? "LOOPING" : "PAUSED"}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const progressKey = "codexsheet.programming-basics.done.v1";

function readDone(): Record<Track, string[]> {
  try {
    const parsed = JSON.parse(localStorage.getItem(progressKey) ?? "{}") as Partial<Record<Track, unknown>>;
    return { Python: Array.isArray(parsed.Python) ? parsed.Python.filter((id): id is string => typeof id === "string") : [], Java: Array.isArray(parsed.Java) ? parsed.Java.filter((id): id is string => typeof id === "string") : [], "C++": Array.isArray(parsed["C++"]) ? parsed["C++"].filter((id): id is string => typeof id === "string") : [] };
  } catch { return { Python: [], Java: [], "C++": [] }; }
}

export default function ProgrammingBasicsArticles() {
  const [track, setTrack] = useState<Track>("Python");
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [done, setDone] = useState(readDone);
  const [reflection, setReflection] = useState("");
  const modules = useMemo(() => [...new Set(lessons.map((item) => item.unit))], []);
  const lesson = lessons.find((item) => item.id === lessonId) ?? null;
  const info = tracks.find((item) => item.id === track)!;
  const completeCount = done[track].length;
  const progress = Math.round(completeCount / lessons.length * 100);
  const nextLesson = lessons.find((item) => !done[track].includes(item.id)) ?? lessons[0]!;

  function chooseTrack(next: Track) { setTrack(next); setLessonId(null); setReflection(""); }
  function openLesson(item: Lesson) { setLessonId(item.id); setReflection(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function markComplete() {
    if (!lesson || done[track].includes(lesson.id)) return;
    const updated = { ...done, [track]: [...done[track], lesson.id] };
    setDone(updated);
    try { localStorage.setItem(progressKey, JSON.stringify(updated)); } catch { /* progress stays in memory */ }
  }

  if (lesson) {
    const article = articles[lesson.id]!;
    const lessonIndex = lessons.findIndex((item) => item.id === lesson.id);
    return <section className={`pb-course pb-reading pb-${info.tone}`} aria-label={`${track} programming article`}>
      <div className="pb-reading-top"><button type="button" className="pb-back" onClick={() => setLessonId(null)}><ArrowLeft size={14} /> Course overview</button><span>{track} <i>·</i> LESSON {String(lessonIndex + 1).padStart(2, "0")} / {String(lessons.length).padStart(2, "0")}</span></div>
      <div className="pb-reading-layout">
        <aside className="pb-article-toc"><span><List size={13} /> IN THIS ARTICLE</span>{["The core idea", "How it works", "Read the example", "Common mistakes", "Practice & reflect", "Key takeaway"].map((label, index) => <a key={label} href={`#pb-article-${index + 1}`}>{String(index + 1).padStart(2, "0")} {label}</a>)}<div className="pb-article-toc-progress"><small>YOUR {track.toUpperCase()} PATH</small><strong>{completeCount}<i> / {lessons.length}</i></strong><span><b style={{ width: `${progress}%` }} /></span><em>{progress}% complete</em></div></aside>
        <article className="pb-article">
          <header className="pb-article-header"><span>{lesson.unit.toUpperCase()} <i>·</i> {lesson.duration.toUpperCase()} READ</span><h1>{lesson.title}</h1><p>{lesson.summary}</p></header>
          <div className="pb-article-lede"><span><Lightbulb size={15} /> START WITH THE IDEA</span><p>{lesson.idea}</p></div>
          <LessonDiagram lessonId={lesson.id} />
          <section id="pb-article-1" className="pb-article-section"><span className="pb-article-section-label">01 · THE CORE IDEA</span><h2>{lesson.title}, in plain language</h2><p>{article.mentalModel}</p><blockquote>{lesson.summary}</blockquote></section>
          <section id="pb-article-2" className="pb-article-section"><span className="pb-article-section-label">02 · HOW IT WORKS</span><h2>Follow the reasoning step by step</h2><ol className="pb-walkthrough">{article.walkthrough.map((step) => <li key={step}><span>{step}</span></li>)}</ol></section>
          <section id="pb-article-3" className="pb-article-section"><span className="pb-article-section-label">03 · READ THE EXAMPLE</span><h2>{track} example</h2><p>Read this program from top to bottom. Before you look at the expected result, trace the values and predict what each instruction contributes.</p><figure className="pb-article-code"><figcaption><span><Code2 size={13} /> {track.toUpperCase()} · COMPLETE EXAMPLE</span><small>READ THROUGH ONCE, THEN TRACE IT</small></figcaption><pre><code>{lesson.example[track]}</code></pre></figure><div className="pb-article-output"><span>EXPECTED OUTPUT</span><pre>{lesson.output}</pre></div><p className="pb-article-input-note"><strong>Input for this example:</strong> {lesson.input.trim() || "No input is needed."}</p></section>
          <section className="pb-article-section"><span className="pb-article-section-label">A CLOSER LOOK · TRANSFER ACROSS LANGUAGES</span><h2>Same idea, different spelling</h2><p>The program’s job does not change when you switch languages. The syntax, standard library, and type rules do. Compare these versions of the same lesson to see which parts are the concept and which parts belong to a language.</p><div className="pb-language-examples">{tracks.filter((item) => item.id !== track).map((item) => <details key={item.id}><summary><span>{item.id} version</span><ChevronRight size={14} /></summary><pre><code>{lesson.example[item.id]}</code></pre></details>)}</div></section>
          <section id="pb-article-4" className="pb-article-section"><span className="pb-article-section-label">04 · COMMON MISTAKES</span><h2>What beginners often miss</h2><ul className="pb-mistakes">{article.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></section>
          <section id="pb-article-5" className="pb-article-section pb-practice-section"><span className="pb-article-section-label">05 · PRACTICE & REFLECT</span><h2>Think it through before you code</h2><p>These prompts are meant for a notebook or a conversation. Describe the steps in your own words first; then write the program in your chosen language.</p><ol>{article.practice.map((prompt) => <li key={prompt}>{prompt}</li>)}</ol><label className="pb-reflection"><span>YOUR NOTES <small>Kept in this session</small></span><textarea value={reflection} onChange={(event) => setReflection(event.target.value)} rows={3} placeholder="Write a prediction, question, or example you want to remember…" /></label><div className="pb-reflection-check"><strong>{lesson.checkpoint.question}</strong><span>{lesson.checkpoint.options[lesson.checkpoint.answer]}</span><small>{lesson.checkpoint.why}</small></div></section>
          <section id="pb-article-6" className="pb-article-takeaway"><span><Sparkles size={14} /> KEY TAKEAWAY</span><p>{article.takeaway}</p></section>
          <div className="pb-article-actions">{done[track].includes(lesson.id) ? <span className="pb-article-done"><Check size={15} /> Lesson complete</span> : <button type="button" onClick={markComplete}>Mark as read <Check size={14} /></button>}{lessons[lessonIndex + 1] && <button type="button" className="next" onClick={() => openLesson(lessons[lessonIndex + 1]!)}>Next article <ArrowRight size={14} /></button>}</div>
        </article>
      </div>
    </section>;
  }

  return <section className={`pb-course pb-${info.tone}`} aria-label="Programming foundations course">
    <header className="pb-hero"><div className="pb-hero-copy"><span className="pb-eyebrow"><GraduationCap size={14} /> CODEXSHEET · PROGRAMMING FOUNDATIONS</span><h1>Start with the<br /><em>building blocks.</em></h1><p>A calm, reading-first introduction to programming. Learn each idea carefully, see how it looks in your language, and practise by reasoning through small examples.</p><div className="pb-hero-foot"><span><BookOpen size={14} /> 8 in-depth articles</span><span><Clock3 size={14} /> Learn at your pace</span></div></div><div className="pb-hero-art" aria-hidden="true"><div className="pb-orbit pb-orbit-one"/><div className="pb-orbit pb-orbit-two"/><div className="pb-art-window"><div><i/><i/><i/><span>first_program</span></div><pre><b>01</b> <em>idea</em> → example<br/><b>02</b> <span>→</span> reasoning<br/><b>03</b> <span>→</span> understanding</pre></div><span className="pb-art-spark">✳</span><span className="pb-art-caption">one concept at a time</span></div></header>
    <section className="pb-tracks"><div className="pb-section-heading"><div><span>CHOOSE A READING TRACK</span><h2>Three ways to begin</h2></div><p>Foundational ideas travel between languages. Choose one track and build your understanding.</p></div><div className="pb-track-grid">{tracks.map((item) => { const count = done[item.id].length; const percent = Math.round(count / lessons.length * 100); return <button key={item.id} type="button" className={`pb-track-card${item.id === track ? " selected" : ""}`} onClick={() => chooseTrack(item.id)}><span className="pb-track-top"><i>{item.slug}</i><span>{count ? `${count} / ${lessons.length} read` : "FOUNDATIONS"}</span></span><strong>{item.id}</strong><small>{item.description}</small><span className="pb-track-progress"><i style={{ width: `${percent}%` }} /></span></button>; })}</div></section>
    <section className="pb-progress-card"><div className="pb-progress-icon"><BookOpen size={17} /></div><div className="pb-progress-copy"><span>{track.toUpperCase()} READING PATH</span><strong>{completeCount}<i> / {lessons.length} articles read</i></strong><small>{completeCount ? `${lessons.length - completeCount} articles left in your foundations` : "Build a clear mental model, one article at a time"}</small></div><div className="pb-progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div><strong className="pb-percent">{progress}<small>%</small></strong><button type="button" onClick={() => setLessonId(nextLesson.id)}>{completeCount ? "Continue reading" : "Start reading"}<ArrowRight size={14} /></button></section>
    <section className="pb-curriculum"><header className="pb-section-heading"><div><span>THE READING LIST</span><h2>{track} foundations</h2></div><p>Each article explains the why, not just the syntax.</p></header><div className="pb-curriculum-list">{modules.map((module, index) => { const items = lessons.filter((item) => item.unit === module); return <section key={module} className="pb-module"><header><span>UNIT {String(index + 1).padStart(2, "0")}</span><strong>{module}</strong><small>{items.filter((item) => done[track].includes(item.id)).length}/{items.length} read</small></header><div>{items.map((item) => <button type="button" key={item.id} className="pb-catalog-lesson" onClick={() => setLessonId(item.id)}><i className={done[track].includes(item.id) ? "done" : ""}>{done[track].includes(item.id) ? <Check size={14} /> : String(lessons.indexOf(item) + 1).padStart(2, "0")}</i><span><strong>{item.title}</strong><small>{item.summary}</small></span><em><Clock3 size={12} /> {item.duration}</em><ArrowRight size={15} /></button>)}</div></section>; })}</div></section>
  </section>;
}
