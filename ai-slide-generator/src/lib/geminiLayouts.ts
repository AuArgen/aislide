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
            { type: "text", x: 260, y: 400, width: 1400, height: 120, fontSize: 56, color: "#FFFFFF", fontWeight: "bold", align: "center", content: "[FILL: Main Presentation Title]" },
            { type: "text", x: 260, y: 560, width: 1400, height: 80, fontSize: 28, color: "#4ECDC4", align: "center", content: "[FILL: Subtitle / Presentation Purpose]" },
            { type: "shape", x: 860, y: 660, width: 200, height: 4, shapeKind: "rect", fillType: "solid", fill: "#4ECDC4" }
        ]
    },
    {
        id: "title_modern_gradient",
        name: "Modern Gradient Title",
        description: "Сол жакта чоң текст, оң жакта декоративдик элементтер менен заманбап титул.",
        elements: [
            { type: "shape", x: 0, y: 0, width: 600, height: 1080, shapeKind: "rect", fillType: "solid", fill: "#1E1E1E" },
            { type: "text", x: 100, y: 350, width: 800, height: 200, fontSize: 72, color: "#FFFFFF", fontWeight: "bold", align: "left", content: "[FILL: Main Title]" },
            { type: "text", x: 100, y: 580, width: 600, height: 100, fontSize: 24, color: "#A0A0A0", align: "left", content: "[FILL: Short tagline or secondary info]" },
            { type: "icon", x: 1200, y: 300, width: 400, height: 400, iconName: "Sparkles", color: "#4ECDC4", opacity: 0.2 },
            { type: "shape", x: 100, y: 680, width: 120, height: 8, shapeKind: "rect", fill: "#4ADE80", borderRadius: 4 }
        ]
    },

    // ─── МААЗМУНДУК БЕТТЕР ───
    {
        id: "content_3_columns_cards",
        name: "Three Column Concept Cards",
        description: "3 бирдей вертикалдык карта. Тизмелер же окшош концепциялар үчүн универсалдуу макет.",
        elements: [
            { type: "text", x: 150, y: 80, width: 500, height: 40, fontSize: 20, color: "#4ECDC4", fontWeight: "bold", align: "left", content: "[FILL: Section Name]" },
            { type: "text", x: 150, y: 130, width: 1400, height: 80, fontSize: 48, color: "#FFFFFF", fontWeight: "bold", align: "left", content: "[FILL: Slide Main Title]" },
            // Card 1
            { type: "shape", x: 150, y: 280, width: 500, height: 550, shapeKind: "rect", fillType: "solid", fill: "#1E1E1E", borderRadius: 16, stroke: "#333333", strokeWidth: 1 },
            { type: "icon", x: 200, y: 330, width: 60, height: 60, iconName: "[FILL: Icon 1]", color: "#4ECDC4" },
            { type: "text", x: 200, y: 420, width: 400, height: 40, fontSize: 24, color: "#FFFFFF", fontWeight: "bold", content: "[FILL: Concept 1 Title]" },
            { type: "text", x: 200, y: 480, width: 400, height: 300, fontSize: 18, color: "#A0A0A0", content: "[FILL: Brief description for concept 1]" },
            // Card 2
            { type: "shape", x: 700, y: 280, width: 500, height: 550, shapeKind: "rect", fillType: "solid", fill: "#1E1E1E", borderRadius: 16, stroke: "#333333", strokeWidth: 1 },
            { type: "icon", x: 750, y: 330, width: 60, height: 60, iconName: "[FILL: Icon 2]", color: "#4ADE80" },
            { type: "text", x: 750, y: 420, width: 400, height: 40, fontSize: 24, color: "#FFFFFF", fontWeight: "bold", content: "[FILL: Concept 2 Title]" },
            { type: "text", x: 750, y: 480, width: 400, height: 300, fontSize: 18, color: "#A0A0A0", content: "[FILL: Brief description for concept 2]" },
            // Card 3
            { type: "shape", x: 1250, y: 280, width: 500, height: 550, shapeKind: "rect", fillType: "solid", fill: "#1E1E1E", borderRadius: 16, stroke: "#333333", strokeWidth: 1 },
            { type: "icon", x: 1300, y: 330, width: 60, height: 60, iconName: "[FILL: Icon 3]", color: "#F59E0B" },
            { type: "text", x: 1300, y: 420, width: 400, height: 40, fontSize: 24, color: "#FFFFFF", fontWeight: "bold", content: "[FILL: Concept 3 Title]" },
            { type: "text", x: 1300, y: 480, width: 400, height: 300, fontSize: 18, color: "#A0A0A0", content: "[FILL: Brief description for concept 3]" }
        ]
    },
    {
        id: "content_feature_list",
        name: "Feature List with Icons",
        description: "Иконкалар жана чоң тексттер менен өзгөчөлүктөрдү тизмектөө.",
        elements: [
            { type: "text", x: 150, y: 150, width: 1400, height: 80, fontSize: 48, color: "#FFFFFF", fontWeight: "bold", align: "left", content: "[FILL: Feature Overview Title]" },
            { type: "icon", x: 150, y: 300, width: 50, height: 50, iconName: "CheckCircle", color: "#4ADE80" },
            { type: "text", x: 230, y: 300, width: 1400, fontSize: 32, color: "#FFFFFF", fontWeight: "bold", content: "[FILL: Feature 1 Title]" },
            { type: "text", x: 230, y: 350, width: 1400, fontSize: 20, color: "#A0A0A0", content: "[FILL: Detailed explanation of feature 1]" },
            
            { type: "icon", x: 150, y: 500, width: 50, height: 50, iconName: "CheckCircle", color: "#4ADE80" },
            { type: "text", x: 230, y: 500, width: 1400, fontSize: 32, color: "#FFFFFF", fontWeight: "bold", content: "[FILL: Feature 2 Title]" },
            { type: "text", x: 230, y: 550, width: 1400, fontSize: 20, color: "#A0A0A0", content: "[FILL: Detailed explanation of feature 2]" },

            { type: "icon", x: 150, y: 700, width: 50, height: 50, iconName: "CheckCircle", color: "#4ADE80" },
            { type: "text", x: 230, y: 700, width: 1400, fontSize: 32, color: "#FFFFFF", fontWeight: "bold", content: "[FILL: Feature 3 Title]" },
            { type: "text", x: 230, y: 750, width: 1400, fontSize: 20, color: "#A0A0A0", content: "[FILL: Detailed explanation of feature 3]" }
        ]
    },
    {
        id: "content_text_and_code",
        name: "Text & Code Block",
        description: "Техникалык түшүндүрмө жана коддун үлгүсү үчүн. Программисттер үчүн эң керектүү макет.",
        elements: [
            { type: "text", x: 150, y: 100, width: 1400, height: 80, fontSize: 48, color: "#FFFFFF", fontWeight: "bold", align: "left", content: "[FILL: Technical Title]" },
            { type: "shape", x: 150, y: 240, width: 680, height: 700, shapeKind: "rect", fill: "#1E1E1E", borderRadius: 16 },
            { type: "text", x: 190, y: 290, width: 600, height: 600, fontSize: 22, color: "#A0A0A0", align: "left", lineHeight: 1.6, content: "[FILL: Deep technical explanation or documentation]" },
            { type: "code", x: 880, y: 240, width: 880, height: 700, language: "javascript", content: "[FILL: Clean and formatted code snippet]" }
        ]
    },
    {
        id: "content_big_quote",
        name: "Big Quote",
        description: "Маанилүү цитата же бир гана башкы ойду баса белгилөө үчүн.",
        elements: [
            { type: "shape", x: 0, y: 530, width: 1920, height: 20, shapeKind: "rect", fill: "#4ECDC4", opacity: 0.1 },
            { type: "icon", x: 150, y: 250, width: 100, height: 100, iconName: "Quote", color: "#4ECDC4", opacity: 0.5 },
            { type: "text", x: 150, y: 400, width: 1600, height: 300, fontSize: 56, color: "#FFFFFF", fontWeight: "bold", align: "center", content: "[FILL: Key Message or Insightful Quote]" },
            { type: "text", x: 150, y: 750, width: 1600, height: 60, fontSize: 24, color: "#4ADE80", fontWeight: "bold", align: "center", content: "[FILL: Author / Expert Name]" }
        ]
    },

    // ─── ЖЫЙЫНТЫКТООЧУ БЕТТЕР ───
    {
        id: "conclusion_summary",
        name: "Action Plan",
        description: "Презентациянын аягында жыйынтык чыгаруу жана кийинки кадамдарды белгилөө үчүн.",
        elements: [
            { type: "shape", x: 0, y: 0, width: 1920, height: 300, shapeKind: "rect", fill: "#1E1E1E" },
            { type: "text", x: 150, y: 110, width: 1600, height: 80, fontSize: 56, color: "#FFFFFF", fontWeight: "bold", align: "center", content: "Жыйынтык жана Кийинки кадамдар" },
            { type: "shape", x: 360, y: 450, width: 1200, height: 320, shapeKind: "rect", fillType: "solid", fill: "#2A2A2A", borderRadius: 24, stroke: "#4ECDC4", strokeWidth: 2 },
            { type: "text", x: 450, y: 520, width: 1020, fontSize: 24, color: "#FFFFFF", align: "center", content: "[FILL: Summary of the main message]" },
            { type: "shape", x: 710, y: 850, width: 500, height: 80, shapeKind: "rect", fill: "#4ECDC4", borderRadius: 40 },
            { type: "text", x: 710, y: 872, width: 500, fontSize: 22, color: "#121212", fontWeight: "bold", align: "center", content: "[FILL: Call to Action Button Text]" }
        ]
    },

    // ─── СҮРӨТТҮҮ МАКЕТТЕР (ЖАҢЫ) ───
    {
        id: "content_image_left",
        name: "Image Left, Text Right",
        description: "Сол жакта чоң сүрөт, оң жакта түшүндүрмө текст.",
        elements: [
            { type: "text", x: 1000, y: 150, width: 800, height: 80, fontSize: 48, color: "#FFFFFF", fontWeight: "bold", align: "left", content: "[FILL: Slide Title]" },
            { type: "image", x: 100, y: 150, width: 850, height: 780, src: "stock:[FILL: relevant image keyword]", borderRadius: 24, objectFit: "cover" },
            { type: "text", x: 1000, y: 280, width: 800, height: 600, fontSize: 24, color: "#A0A0A0", align: "left", content: "[FILL: Detailed explanation on the right]" }
        ]
    },
    {
        id: "content_image_right",
        name: "Text Left, Image Right",
        description: "Сол жакта текст, оң жакта чоң сүрөт.",
        elements: [
            { type: "text", x: 100, y: 150, width: 800, height: 80, fontSize: 48, color: "#FFFFFF", fontWeight: "bold", align: "left", content: "[FILL: Slide Title]" },
            { type: "image", x: 970, y: 150, width: 850, height: 780, src: "stock:[FILL: relevant image keyword]", borderRadius: 24, objectFit: "cover" },
            { type: "text", x: 100, y: 280, width: 800, height: 600, fontSize: 24, color: "#A0A0A0", align: "left", content: "[FILL: Detailed explanation on the left]" }
        ]
    },
    {
        id: "content_full_image_overlay",
        name: "Full Background Image with Overlay",
        description: "Толук экрандагы сүрөт жана анын үстүндөгү борборлоштурулган текст.",
        elements: [
            // Сүрөт фон катары колдонулат (bg.type = 'image'), бирок бул жерде макеттин түзүмүн көрсөтүү үчүн текстти кошобуз
            { type: "shape", x: 460, y: 340, width: 1000, height: 400, shapeKind: "rect", fill: "#000000", opacity: 0.6, borderRadius: 24 },
            { type: "text", x: 510, y: 440, width: 900, height: 200, fontSize: 56, color: "#FFFFFF", fontWeight: "bold", align: "center", content: "[FILL: Powerful center statement]" }
        ]
    }
]