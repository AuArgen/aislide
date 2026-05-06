export const presentationTemplates = [
    {
        id: 'pitch-deck',
        nameKey: 'editor.templatePitchDeck',
        name: 'Стартап үчүн Pitch Deck',
        description: 'Инвесторлор үчүн кыска жана эффективдүү презентация',
        slides: [
            { title: 'Долбоордун аталышы', elements: [{ id: '1', type: 'text', content: 'Сиздин стартаптын урааны', x: 0, y: 0, fontSize: 24 }] },
            { title: 'Көйгөй (Problem)', elements: [{ id: '2', type: 'text', content: 'Кандай көйгөйдү чечип жатасыз?', x: 0, y: 0, fontSize: 24 }] },
            { title: 'Чечим (Solution)', elements: [{ id: '3', type: 'text', content: 'Сиздин уникалдуу сунушуңуз', x: 0, y: 0, fontSize: 24 }] },
            { title: 'Рыноктун көлөмү (Market Size)', elements: [{ id: '4', type: 'text', content: 'TAM, SAM, SOM көрсөткүчтөрү', x: 0, y: 0, fontSize: 24 }] },
            { title: 'Бизнес модель', elements: [{ id: '5', type: 'text', content: 'Кантип акча табасыз?', x: 0, y: 0, fontSize: 24 }] }
        ]
    },
    {
        id: 'report',
        nameKey: 'editor.templateReport',
        name: 'Жылдык отчет',
        description: 'Компаниянын же долбоордун жыйынтыктары',
        slides: [
            { title: 'Жылдык отчет 2025', elements: [{ id: 'r1', type: 'text', content: 'Негизги жетишкендиктер', x: 0, y: 0, fontSize: 24 }] },
            { title: 'Финансылык көрсөткүчтөр', elements: [{ id: 'r2', type: 'formula', content: '\text{Пайда} = \text{Киреше} - \text{Чыгым}', x: 0, y: 0, fontSize: 24 }] },
            { title: 'Графиктер жана талдоо', elements: [{ id: 'r3', type: 'text', content: 'Өсүү динамикасы', x: 0, y: 0, fontSize: 24 }] }
        ]
    }
]
