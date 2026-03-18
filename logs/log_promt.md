3 слайддан турган презентация тузуу учун 
Кардардын сурамы (Topic)
What is c++


Толук Системалык Сурам
================================================================================
CRITICAL LANGUAGE RULE - READ THIS FIRST!
================================================================================
You MUST identify the language of the user's input topic (What is c++).
You MUST generate 100% of the outline content (slide titles, core messages) in that EXACT SAME LANGUAGE.
- If the user writes in Kyrgyz (Кыргызча), output in Kyrgyz.
- If the user writes in Russian (Русский), output in Russian.
- If the user writes in English, output in English.
- If the user writes in ANY other language, output in THAT language.

FORBIDDEN: 
- DO NOT translate the user's topic into English.
- DO NOT default to English.
- DO NOT switch languages in the outline.
LANGUAGE SWITCHING IS A CRITICAL FAILURE. Any deviation from the detected input language will result in incorrect output.
================================================================================

You are a world-class professional presentation designer.
Create ONLY the structure (outline) for a presentation based on the user's topic.

TOPIC: What is c++
NUMBER OF SLIDES: 3
AUDIENCE: General
STYLE/TONE: Professional, clear, and business-oriented.

Return ONLY the following JSON array format, with absolutely no additional text or markdown formatting:
[
  {
    "slideNumber": 1,
    "title": "Slide Title",
    "coreMessage": "Core meaning/message of the slide (1-2 sentences)",
    "suggestedVisual": "Suggested visual design or image"
  }
]



ИИнин Жообу (Raw JSON)

```json
[
  {
    "slideNumber": 1,
    "title": "What is C++? An Overview",
    "coreMessage": "C++ is a powerful, general-purpose programming language known for its high performance and control, widely utilized in diverse computing domains.",
    "suggestedVisual": "C++ logo with a background of abstract code snippets or interconnected digital elements."
  },
  {
    "slideNumber": 2,
    "title": "Core Strengths: Performance, Control, and Versatility",
    "coreMessage": "Key features include object-oriented programming capabilities, direct memory manipulation for efficiency, and a robust standard library, making it ideal for resource-intensive applications.",
    "suggestedVisual": "Infographic highlighting keywords like 'Performance', 'Control', 'OOP', 'Memory Management' with corresponding icons."
  },
  {
    "slideNumber": 3,
    "title": "Real-World Impact: Where C++ Shines",
    "coreMessage": "C++ is foundational for operating systems, game engines, high-frequency trading systems, embedded systems, and other performance-critical software across various industries.",
    "suggestedVisual": "Collage of icons representing common applications: game controller, server rack, car dashboard, operating system window."
  }
]
```



JSON ВАЛИДТҮҮ
18.03.2026, 09:54:55

1000 tokens
$0.000113
3.99s

## программа улантып жатат ар бир слайды жасоону 
1-слайд
Кардардын сурамы (Topic)
What is C++? An Overview

Толук Системалык Сурам


================================================================================
CRITICAL LANGUAGE RULE - READ THIS FIRST!
================================================================================
You MUST identify the language of the provided slide outline (What is C++? An Overview and C++ is a powerful, general-purpose programming language known for its high performance and control, widely utilized in diverse computing domains.).
You MUST generate 100% of the slide content (title, bullet points, body text) in that EXACT SAME LANGUAGE.
- If the outline is in Kyrgyz (Кыргызча), output in Kyrgyz.
- If the outline is in Russian (Русский), output in Russian.
- If the outline is in English, output in English.
- If the outline is in ANY other language, output in THAT language.

FORBIDDEN: 
- DO NOT translate the slide content into English.
- DO NOT default to English.
- DO NOT switch languages in the slide content.
LANGUAGE SWITCHING IS A CRITICAL FAILURE. Any deviation from the detected input language will result in incorrect output.
================================================================================

You are a world-class professional presentation designer and content writer.
Based on the following outline information, create the full visual and content structure for EXACTLY ONE slide.

SLIDE OUTLINE:
Title: What is C++? An Overview
Core Message: C++ is a powerful, general-purpose programming language known for its high performance and control, widely utilized in diverse computing domains.
Visual Suggestion: C++ logo with a background of abstract code snippets or interconnected digital elements.

COLOR THEME: Modern Dark
(Select an appropriate 'background' and 'titleColor' fitting this theme).

DESIGN AND STRICT COORDINATE RULES (PAY CLOSE ATTENTION):
The standard slide dimension is WIDTH: 1920px and HEIGHT: 1080px.
ALL coordinates and dimensions (x, y, width, height) MUST be based on this 1920x1080 pixel grid and provided as absolute integers (pixels). NEVER use percentages (0-100)!
- x: 0-1920. For text, start 150-200 pixels from the left edge.
- y: 0-1080. First element 150-200px from top, subsequent ones downwards. Space out bullet points (at least 100-150px gap).
- width: 0-1920. For main text body, use width 1400-1600.
- align: "left", "center", or "right".
- fontWeight: "normal" or "bold".
- fontSize: in pixels (main text 28-36, bullet titles 36-48, large main titles 64-96).
- color: Text color MUST contrast well with the chosen background.

Return ONLY raw JSON. Do NOT include markdown formatting like ```json.
{
  "title": "${outlineItem.title}",
  "background": "Background (e.g. hex #0f172a, or linear-gradient)",
  "titleColor": "#ffffff",
  "elements": [
    {
      "type": "text",
      "content": "• Slide content (detailed bullet point)",
      "x": 150,
      "y": 200,
      "width": 1400,
      "fontSize": 36,
      "color": "#ffffff",
      "align": "left",
      "fontWeight": "normal"
    }
  ],
  "visual_hint": "${outlineItem.suggestedVisual}"
}


ИИнин Жообу (Raw JSON)

{
  "title": "What is C++? An Overview",
  "background": "#1a1a2e",
  "titleColor": "#ffffff",
  "elements": [
    {
      "type": "text",
      "content": "What is C++? An Overview",
      "x": 180,
      "y": 150,
      "width": 1560,
      "fontSize": 80,
      "color": "#ffffff",
      "align": "left",
      "fontWeight": "bold"
    },
    {
      "type": "text",
      "content": "• Powerful and Versatile: A general-purpose language supporting various programming paradigms like object-oriented, generic, and procedural programming.",
      "x": 180,
      "y": 350,
      "width": 1500,
      "fontSize": 36,
      "color": "#ffffff",
      "align": "left",
      "fontWeight": "normal"
    },
    {
      "type": "text",
      "content": "• High Performance and Control: Known for its high speed, efficiency, and direct memory manipulation, making it ideal for resource-intensive applications.",
      "x": 180,
      "y": 500,
      "width": 1500,
      "fontSize": 36,
      "color": "#ffffff",
      "align": "left",
      "fontWeight": "normal"
    },
    {
      "type": "text",
      "content": "• Diverse Applications: Widely utilized in computing domains such as game development, operating systems, embedded systems, and high-performance computing.",
      "x": 180,
      "y": 650,
      "width": 1500,
      "fontSize": 36,
      "color": "#ffffff",
      "align": "left",
      "fontWeight": "normal"
    }
  ],
  "visual_hint": "C++ logo with a background of abstract code snippets or interconnected digital elements."
}


Статус

JSON ВАЛИДТҮҮ
18.03.2026, 09:55:15

4970 tokens
$0.000209
18.71s


2-слайд
Кардардын сурамы (Topic)
Core Strengths: Performance, Control, and Versatility

Толук Системалык Сурам


================================================================================
CRITICAL LANGUAGE RULE - READ THIS FIRST!
================================================================================
You MUST identify the language of the provided slide outline (Core Strengths: Performance, Control, and Versatility and Key features include object-oriented programming capabilities, direct memory manipulation for efficiency, and a robust standard library, making it ideal for resource-intensive applications.).
You MUST generate 100% of the slide content (title, bullet points, body text) in that EXACT SAME LANGUAGE.
- If the outline is in Kyrgyz (Кыргызча), output in Kyrgyz.
- If the outline is in Russian (Русский), output in Russian.
- If the outline is in English, output in English.
- If the outline is in ANY other language, output in THAT language.

FORBIDDEN: 
- DO NOT translate the slide content into English.
- DO NOT default to English.
- DO NOT switch languages in the slide content.
LANGUAGE SWITCHING IS A CRITICAL FAILURE. Any deviation from the detected input language will result in incorrect output.
================================================================================

You are a world-class professional presentation designer and content writer.
Based on the following outline information, create the full visual and content structure for EXACTLY ONE slide.

SLIDE OUTLINE:
Title: Core Strengths: Performance, Control, and Versatility
Core Message: Key features include object-oriented programming capabilities, direct memory manipulation for efficiency, and a robust standard library, making it ideal for resource-intensive applications.
Visual Suggestion: Infographic highlighting keywords like 'Performance', 'Control', 'OOP', 'Memory Management' with corresponding icons.

COLOR THEME: Modern Dark
(Select an appropriate 'background' and 'titleColor' fitting this theme).

DESIGN AND STRICT COORDINATE RULES (PAY CLOSE ATTENTION):
The standard slide dimension is WIDTH: 1920px and HEIGHT: 1080px.
ALL coordinates and dimensions (x, y, width, height) MUST be based on this 1920x1080 pixel grid and provided as absolute integers (pixels). NEVER use percentages (0-100)!
- x: 0-1920. For text, start 150-200 pixels from the left edge.
- y: 0-1080. First element 150-200px from top, subsequent ones downwards. Space out bullet points (at least 100-150px gap).
- width: 0-1920. For main text body, use width 1400-1600.
- align: "left", "center", or "right".
- fontWeight: "normal" or "bold".
- fontSize: in pixels (main text 28-36, bullet titles 36-48, large main titles 64-96).
- color: Text color MUST contrast well with the chosen background.

Return ONLY raw JSON. Do NOT include markdown formatting like ```json.
{
  "title": "${outlineItem.title}",
  "background": "Background (e.g. hex #0f172a, or linear-gradient)",
  "titleColor": "#ffffff",
  "elements": [
    {
      "type": "text",
      "content": "• Slide content (detailed bullet point)",
      "x": 150,
      "y": 200,
      "width": 1400,
      "fontSize": 36,
      "color": "#ffffff",
      "align": "left",
      "fontWeight": "normal"
    }
  ],
  "visual_hint": "${outlineItem.suggestedVisual}"
}


ИИнин Жообу (Raw JSON)

{
  "title": "Core Strengths: Performance, Control, and Versatility",
  "background": "#0F172A",
  "titleColor": "#E2E8F0",
  "elements": [
    {
      "type": "text",
      "content": "1. Object-Oriented Programming (OOP) Capabilities",
      "x": 180,
      "y": 300,
      "width": 1500,
      "fontSize": 40,
      "color": "#E2E8F0",
      "align": "left",
      "fontWeight": "bold"
    },
    {
      "type": "text",
      "content": "Leverage powerful OOP principles for modular, reusable, and scalable code structures, promoting robust application design.",
      "x": 220,
      "y": 360,
      "width": 1460,
      "fontSize": 32,
      "color": "#E2E8F0",
      "align": "left",
      "fontWeight": "normal"
    },
    {
      "type": "text",
      "content": "2. Direct Memory Manipulation",
      "x": 180,
      "y": 480,
      "width": 1500,
      "fontSize": 40,
      "color": "#E2E8F0",
      "align": "left",
      "fontWeight": "bold"
    },
    {
      "type": "text",
      "content": "Achieve unparalleled efficiency and fine-grained control over system resources, critical for high-performance computing.",
      "x": 220,
      "y": 540,
      "width": 1460,
      "fontSize": 32,
      "color": "#E2E8F0",
      "align": "left",
      "fontWeight": "normal"
    },
    {
      "type": "text",
      "content": "3. Robust Standard Library",
      "x": 180,
      "y": 660,
      "width": 1500,
      "fontSize": 40,
      "color": "#E2E8F0",
      "align": "left",
      "fontWeight": "bold"
    },
    {
      "type": "text",
      "content": "Benefit from a comprehensive and mature standard library, providing a rich set of tools and functionalities for rapid development across various domains.",
      "x": 220,
      "y": 720,
      "width": 1460,
      "fontSize": 32,
      "color": "#E2E8F0",
      "align": "left",
      "fontWeight": "normal"
    },
    {
      "type": "text",
      "content": "Ideal for Resource-Intensive Applications",
      "x": 180,
      "y": 860,
      "width": 1500,
      "fontSize": 40,
      "color": "#E2E8F0",
      "align": "left",
      "fontWeight": "bold"
    },
    {
      "type": "text",
      "content": "Ensuring reliability and speed where it matters most, in demanding computing environments.",
      "x": 220,
      "y": 920,
      "width": 1460,
      "fontSize": 32,
      "color": "#E2E8F0",
      "align": "left",
      "fontWeight": "normal"
    }
  ],
  "visual_hint": "Infographic highlighting keywords like 'Performance', 'Control', 'OOP', 'Memory Management' with corresponding icons."
}


Статус

JSON ВАЛИДТҮҮ
18.03.2026, 09:55:31

4689 tokens
$0.000335
16.30s



3 - слайд
Кардардын сурамы (Topic)
Real-World Impact: Where C++ Shines

Толук Системалык Сурам


================================================================================
CRITICAL LANGUAGE RULE - READ THIS FIRST!
================================================================================
You MUST identify the language of the provided slide outline (Real-World Impact: Where C++ Shines and C++ is foundational for operating systems, game engines, high-frequency trading systems, embedded systems, and other performance-critical software across various industries.).
You MUST generate 100% of the slide content (title, bullet points, body text) in that EXACT SAME LANGUAGE.
- If the outline is in Kyrgyz (Кыргызча), output in Kyrgyz.
- If the outline is in Russian (Русский), output in Russian.
- If the outline is in English, output in English.
- If the outline is in ANY other language, output in THAT language.

FORBIDDEN: 
- DO NOT translate the slide content into English.
- DO NOT default to English.
- DO NOT switch languages in the slide content.
LANGUAGE SWITCHING IS A CRITICAL FAILURE. Any deviation from the detected input language will result in incorrect output.
================================================================================

You are a world-class professional presentation designer and content writer.
Based on the following outline information, create the full visual and content structure for EXACTLY ONE slide.

SLIDE OUTLINE:
Title: Real-World Impact: Where C++ Shines
Core Message: C++ is foundational for operating systems, game engines, high-frequency trading systems, embedded systems, and other performance-critical software across various industries.
Visual Suggestion: Collage of icons representing common applications: game controller, server rack, car dashboard, operating system window.

COLOR THEME: Modern Dark
(Select an appropriate 'background' and 'titleColor' fitting this theme).

DESIGN AND STRICT COORDINATE RULES (PAY CLOSE ATTENTION):
The standard slide dimension is WIDTH: 1920px and HEIGHT: 1080px.
ALL coordinates and dimensions (x, y, width, height) MUST be based on this 1920x1080 pixel grid and provided as absolute integers (pixels). NEVER use percentages (0-100)!
- x: 0-1920. For text, start 150-200 pixels from the left edge.
- y: 0-1080. First element 150-200px from top, subsequent ones downwards. Space out bullet points (at least 100-150px gap).
- width: 0-1920. For main text body, use width 1400-1600.
- align: "left", "center", or "right".
- fontWeight: "normal" or "bold".
- fontSize: in pixels (main text 28-36, bullet titles 36-48, large main titles 64-96).
- color: Text color MUST contrast well with the chosen background.

Return ONLY raw JSON. Do NOT include markdown formatting like ```json.
{
  "title": "${outlineItem.title}",
  "background": "Background (e.g. hex #0f172a, or linear-gradient)",
  "titleColor": "#ffffff",
  "elements": [
    {
      "type": "text",
      "content": "• Slide content (detailed bullet point)",
      "x": 150,
      "y": 200,
      "width": 1400,
      "fontSize": 36,
      "color": "#ffffff",
      "align": "left",
      "fontWeight": "normal"
    }
  ],
  "visual_hint": "${outlineItem.suggestedVisual}"
}

ИИнин Жообу (Raw JSON)
{
  "title": "Real-World Impact: Where C++ Shines",
  "background": "#1a202c",
  "titleColor": "#ffffff",
  "elements": [
    {
      "type": "text",
      "content": "C++ stands as a foundational language for developing software where performance, efficiency, and direct hardware control are paramount. Its versatility allows it to power critical systems across diverse sectors.",
      "x": 150,
      "y": 300,
      "width": 1600,
      "fontSize": 32,
      "color": "#ffffff",
      "align": "left",
      "fontWeight": "normal"
    },
    {
      "type": "text",
      "content": "• Operating Systems: From core kernels to system utilities, C++ provides the low-level control and performance necessary for OS development.",
      "x": 150,
      "y": 450,
      "width": 1600,
      "fontSize": 32,
      "color": "#ffffff",
      "align": "left",
      "fontWeight": "normal"
    },
    {
      "type": "text",
      "content": "• Game Engines: Powering high-performance graphics, complex physics, and real-time interaction in major game engines and titles.",
      "x": 150,
      "y": 570,
      "width": 1600,
      "fontSize": 32,
      "color": "#ffffff",
      "align": "left",
      "fontWeight": "normal"
    },
    {
      "type": "text",
      "content": "• High-Frequency Trading Systems: Enabling ultra-low latency execution and complex algorithmic strategies in financial markets.",
      "x": 150,
      "y": 690,
      "width": 1600,
      "fontSize": 32,
      "color": "#ffffff",
      "align": "left",
      "fontWeight": "normal"
    },
    {
      "type": "text",
      "content": "• Embedded Systems: Driving automotive systems, IoT devices, medical equipment, and industrial automation where resources are constrained.",
      "x": 150,
      "y": 810,
      "width": 1600,
      "fontSize": 32,
      "color": "#ffffff",
      "align": "left",
      "fontWeight": "normal"
    },
    {
      "type": "text",
      "content": "• Other Performance-Critical Software: Beyond these, C++ is vital for compilers, databases, scientific computing, and demanding enterprise applications.",
      "x": 150,
      "y": 930,
      "width": 1600,
      "fontSize": 32,
      "color": "#ffffff",
      "align": "left",
      "fontWeight": "normal"
    }
  ],
  "visual_hint": "Collage of icons representing common applications: game controller, server rack, car dashboard, operating system window."
}

Статус

JSON ВАЛИДТҮҮ
18.03.2026, 09:55:43

3332 tokens
$0.000283
10.96s