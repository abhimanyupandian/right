// place files you want to import through the `$lib` alias in this folder.

import type { IndexType } from "./types";

export const Symbols = {
    EOL: "\n",
    SPACE: " ",
    DOT: "•",
    DASH: "-",
    EMPTY: ""
}

export const Delimeters: Record<IndexType, string> = {
    title: "#" + Symbols.SPACE,
    subtitle: "##" + Symbols.SPACE,
    heading: "--" + Symbols.SPACE,
    content: Symbols.EMPTY,
};

export const Indicator: Record<IndexType, string> = {
    title: Symbols.DOT,
    subtitle: Symbols.DOT,
    heading: Symbols.DASH,
    content: Symbols.EMPTY,
};

export const DefaultTheme = {
    background: "#222",
    f_high: "#eee",
    f_med: "#888",
    f_low: "#666",
    f_inv: "#00f",
    b_high: "#f9a",
    b_med: "#a9f",
    b_low: "#000",
    b_inv: "#af9",
    hl_bg: "black",
    hl_fg: "yellow",
    "font-family": "custom_mono",
    "font-size": "16px",
    "line-height": "24px",
};

export const PageContent = `# Welcome
# Introduction
# Chapter 1
Numbers are fundamental to computer science because they are the primary means by which information is represented and processed. At the most basic level, all digital computers operate using numbers, specifically binary numbers, which consist of only two values: 0 and 1. These values correspond to the electrical states within the computer's hardware, where 0 represents an “off” state and 1 represents an “on” state. Every piece of data, every instruction, and every computation is ultimately expressed through combinations of these binary digits, or bits. This low-level representation enables computers to perform the vast array of tasks that define modern technology, from simple calculations to complex artificial intelligence algorithms.

## What are they?
Numbers are also integral to higher-level programming. In almost every programming language, numbers are used to manipulate data, control the flow of logic, and structure algorithms. For instance, loops are often defined using numerical conditions (e.g., “for i = 0 to 10”), and numerical data types (integers, floats, etc.) are used to perform arithmetic, store values, and represent things like coordinates in graphics. Beyond arithmetic, numbers enable optimization, pattern recognition, and decision-making in software. Algorithms, the core of problem-solving in computer science, frequently rely on numerical processes, whether sorting data, solving equations, or processing signals.

# Chapter 2
However, while numbers are central to computation, they are not the only means of representing information. For example, logic-based systems, such as Boolean algebra, use true/false (or 1/0) conditions to model logical operations, which are critical in both software and hardware design. In programming, strings (textual data) and abstract data structures like trees or graphs offer ways to manipulate data that are less number-centric. Yet, even these alternatives are, at some level, reducible to numerical forms when processed by the machine. For instance, characters in a string are represented by numerical codes (such as ASCII), and abstract structures like graphs are often modeled numerically for processing by algorithms.

## Why do we need them?
In the realm of advanced computing, alternatives like quantum computing offer a glimpse into new paradigms that could reduce the dominance of traditional number-based computation. In quantum computing, information is stored in qubits, which, unlike classical bits, can represent multiple states simultaneously due to the principles of quantum superposition. This creates new opportunities for computational processes that are less dependent on traditional numerical computation. Nevertheless, even quantum computers still rely on numbers, albeit in a more complex form, to process information.

## Can they help us understand the universe?
The historical significance of numbers in computer science dates back to the earliest ideas of automated computation. Charles Babbage’s Analytical Engine, conceptualized in the 19th century, was designed to perform calculations using numbers mechanically. Later, the development of electronic computers in the mid-20th century, like the ENIAC, further solidified the importance of numbers by making digital, binary-based computation possible. With the advent of digital computing, the use of binary numbers became central to all modern computational systems. From that point on, numbers, especially in binary form, became synonymous with computing, defining how machines store, process, and transmit data.

Over time, as the complexity of computers grew, the role of numbers expanded from simple calculations to underpinning the entire infrastructure of modern technology. Numbers drive algorithms that power everything from scientific simulations to machine learning models, control systems, and communication protocols. The numerical foundation of computer science ensures efficiency, precision, and scalability, which are vital for the performance of large-scale systems. Even as new computational paradigms emerge, numbers are likely to remain central due to their deeply ingrained role in how we interact with, understand, and build technology.

In conclusion, numbers are essential to computer science because they serve as the fundamental building blocks of computation, both at the hardware and software levels. While alternatives like Boolean logic and quantum computing offer other means of representing and processing information, these systems either supplement numerical computation or transform it into more complex numerical forms. Since the earliest days of mechanical computation, numbers have been the core mechanism enabling machines to solve problems, and they continue to be crucial in driving innovation and progress in the field.
`