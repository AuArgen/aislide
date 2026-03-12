export interface TemplateLayout {
    id: string
    name: string
    description: string
    elements: any[]
}

// Modern Dark Tech Aesthetic:
// Background: #121212, Card: #1E1E1E, Accents: #4ECDC4 (Cyan), #4ADE80 (Emerald)

export const GEMINI_LAYOUTS: TemplateLayout[] = [
    // ─── ТИТУЛДУК БЕТТЕР ───
    {
        id: "title_center",
        name: "Centered Tech Title",
        description: "Негизги титулдук бет. Ортодо жайгашкан текст жана акцент сызыгы менен.",
        elements: [
            { type: "text", x: 260, y: 400, width: 1400, height: 120, fontSize: 44, color: "#FFFFFF", fontWeight: "bold", align: "center", content: "[FILL: Main Presentation Title]" },
            { type: "text", x: 260, y: 560, width: 1400, height: 80, fontSize: 24, color: "#4ECDC4", align: "center", content: "[FILL: Subtitle / Presentation Purpose]" },
            { type: "shape", x: 860, y: 660, width: 200, height: 4, shapeKind: "rect", fillType: "solid", fill: "#4ECDC4" }
        ]
    },
    {
        id: "title_split_cards",
        name: "Split Title Cards",
        description: "Сол жакта титул, оң жакта кыскача мазмун (summary) үчүн карта.",
        elements: [
            { type: "shape", x: 1060, y: 200, width: 700, height: 680, shapeKind: "rect", fillType: "solid", fill: "#1E1E1E", borderRadius: 12, stroke: "#333333", strokeWidth: 1 },
            { type: "shape", x: 1060, y: 200, width: 700, height: 4, shapeKind: "rect", fillType: "solid", fill: "#4ECDC4" },
            { type: "text", x: 150, y: 400, width: 800, height: 150, fontSize: 42, color: "#FFFFFF", fontWeight: "bold", align: "left", content: "[FILL: Title]" },
            { type: "text", x: 1120, y: 280, width: 580, height: 60, fontSize: 18, color: "#4ADE80", fontWeight: "bold", align: "left", content: "[FILL: Key Takeaway Heading]" },
            { type: "text", x: 1120, y: 360, width: 580, height: 400, fontSize: 16, color: "#A0A0A0", align: "left", lineHeight: 1.6, content: "[FILL: 3-4 Bullet points summarizing the presentation.]" }
        ]
    },

    // ─── МААЗМУНДУК БЕТТЕР ───
    {
        id: "content_3_columns_cards",
        name: "Three Column Concept Cards",
        description: "3 бирдей вертикалдык карта. Тизмелер же окшош концепциялар үчүн универсалдуу макет.",
        elements: [
            { type: "text", x: 150, y: 100, width: 500, height: 40, fontSize: 20, color: "#4ECDC4", fontWeight: "bold", align: "left", content: "[FILL: 02 / SECTION NAME]" },
            { type: "text", x: 150, y: 150, width: 1400, height: 80, fontSize: 42, color: "#FFFFFF", fontWeight: "bold", align: "left", content: "[FILL: Slide Main Title]" },
            // Card 1, 2, 3 (Оптималдаштыруу үчүн бул жерде 3 мамычалуу формат калтырылды)
            { type: "shape", x: 150, y: 280, width: 500, height: 500, shapeKind: "rect", fillType: "solid", fill: "#1E1E1E", borderRadius: 12, stroke: "#333333", strokeWidth: 1 },
            { type: "text", x: 190, y: 400, width: 420, height: 40, fontSize: 18, color: "#FFFFFF", fontWeight: "bold", content: "[FILL: Concept 1]" },
            { type: "shape", x: 700, y: 280, width: 500, height: 500, shapeKind: "rect", fillType: "solid", fill: "#1E1E1E", borderRadius: 12, stroke: "#333333", strokeWidth: 1 },
            { type: "text", x: 740, y: 400, width: 420, height: 40, fontSize: 18, color: "#FFFFFF", fontWeight: "bold", content: "[FILL: Concept 2]" },
            { type: "shape", x: 1250, y: 280, width: 500, height: 500, shapeKind: "rect", fillType: "solid", fill: "#1E1E1E", borderRadius: 12, stroke: "#333333", strokeWidth: 1 },
            { type: "text", x: 1290, y: 400, width: 420, height: 40, fontSize: 18, color: "#FFFFFF", fontWeight: "bold", content: "[FILL: Concept 3]" }
        ]
    },
    {
        id: "content_text_and_code",
        name: "Text & Code Block",
        description: "Техникалык түшүндүрмө жана коддун үлгүсү үчүн. Программисттер үчүн эң керектүү макет.",
        elements: [
            { type: "text", x: 150, y: 150, width: 1400, height: 80, fontSize: 42, color: "#FFFFFF", fontWeight: "bold", align: "left", content: "[FILL: Technical Title]" },
            { type: "text", x: 150, y: 280, width: 650, height: 600, fontSize: 20, color: "#A0A0A0", align: "left", content: "[FILL: Explanation with ✓]" },
            { type: "code", x: 880, y: 280, width: 880, height: 500, language: "javascript", content: "[FILL: Code snippet]" }
        ]
    },
    {
        id: "content_2x2_grid",
        name: "2x2 Feature Grid",
        description: "4 негизги функцияны же өзгөчөлүктү көрсөтүү үчүн торчо (grid) макети.",
        elements: [
            { type: "text", x: 150, y: 150, width: 1400, height: 80, fontSize: 42, color: "#FFFFFF", fontWeight: "bold", align: "left", content: "[FILL: Features Overview]" },
            { type: "shape", x: 150, y: 280, width: 750, height: 280, shapeKind: "rect", fill: "#1E1E1E", borderRadius: 12 },
            { type: "shape", x: 950, y: 280, width: 750, height: 280, shapeKind: "rect", fill: "#1E1E1E", borderRadius: 12 },
            { type: "shape", x: 150, y: 600, width: 750, height: 280, shapeKind: "rect", fill: "#1E1E1E", borderRadius: 12 },
            { type: "shape", x: 950, y: 600, width: 750, height: 280, shapeKind: "rect", fill: "#1E1E1E", borderRadius: 12 }
        ]
    },
    {
        id: "content_step_by_step_horizontal",
        name: "Process Roadmap",
        description: "Процессти же кадамдарды (1-2-3) көрсөтүү үчүн жебелер менен байланышкан макет.",
        elements: [
            { type: "text", x: 150, y: 150, width: 1400, height: 80, fontSize: 42, color: "#FFFFFF", fontWeight: "bold", align: "left", content: "[FILL: Process Workflow]" },
            { type: "text", x: 180, y: 350, fontSize: 32, color: "#4ECDC4", content: "1" },
            { type: "shape", x: 630, y: 500, width: 60, height: 24, shapeKind: "arrow-right", fill: "#333333" },
            { type: "text", x: 740, y: 350, fontSize: 32, color: "#4ADE80", content: "2" },
            { type: "shape", x: 1190, y: 500, width: 60, height: 24, shapeKind: "arrow-right", fill: "#333333" },
            { type: "text", x: 1300, y: 350, fontSize: 32, color: "#4ECDC4", content: "3" }
        ]
    },
    {
        id: "content_big_quote",
        name: "Big Quote",
        description: "Маанилүү цитата же бир гана башкы ойду баса белгилөө үчүн.",
        elements: [
            { type: "icon", x: 150, y: 250, width: 120, height: 120, iconName: "Quote", color: "#4ECDC4", size: 120, opacity: 0.3 },
            { type: "text", x: 150, y: 420, width: 1400, height: 300, fontSize: 42, color: "#FFFFFF", fontWeight: "bold", content: "[FILL: Key Message]" },
            { type: "text", x: 150, y: 800, width: 800, height: 60, fontSize: 18, color: "#A0A0A0", content: "[FILL: Author / Source]" }
        ]
    },

    // ─── ЖЫЙЫНТЫКТООЧУ БЕТТЕР ───
    {
        id: "conclusion_summary",
        name: "Action Plan",
        description: "Презентациянын аягында жыйынтык чыгаруу жана кийинки кадамдарды белгилөө үчүн.",
        elements: [
            { type: "text", x: 150, y: 150, width: 1600, height: 80, fontSize: 42, color: "#FFFFFF", fontWeight: "bold", align: "center", content: "Conclusion & Next Steps" },
            { type: "shape", x: 360, y: 800, width: 1200, height: 100, shapeKind: "rect", fillType: "solid", fill: "#4ECDC4", borderRadius: 12 },
            { type: "text", x: 400, y: 830, width: 1120, height: 40, fontSize: 18, color: "#121212", fontWeight: "bold", align: "center", content: "[FILL: Final Call to Action]" }
        ]
    }
]