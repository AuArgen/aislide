import pptxgen from "pptxgenjs";

export interface SlideData {
  title: string;
  content: string;
  image?: string;
}

/**
 * Презентацияны PowerPoint (.pptx) форматына экспорттоо
 */
export async function exportToPPTX(title: string, slides: SlideData[]) {
  const pptx = new pptxgen();

  // Документтин касиеттери
  pptx.title = title;
  pptx.subject = "AI Generated Presentation";
  pptx.author = "AI Slide Generator";

  slides.forEach((slideData) => {
    const slide = pptx.addSlide();

    // Слайддын аталышы
    slide.addText(slideData.title, {
      x: 0.5,
      y: 0.5,
      w: "90%",
      fontSize: 32,
      bold: true,
      color: "363636",
      fontFace: "Arial",
    });

    // Слайддын мазмуну
    slide.addText(slideData.content, {
      x: 0.5,
      y: 1.5,
      w: slideData.image ? "50%" : "90%",
      fontSize: 18,
      color: "666666",
      fontFace: "Arial",
      bullet: true,
      valign: "top",
    });

    // Эгер сүрөт болсо, аны кошуу
    if (slideData.image) {
      slide.addImage({
        path: slideData.image,
        x: 5.5,
        y: 1.2,
        w: 4,
        h: 3,
      });
    }
  });

  // Файлды жүктөө
  return pptx.writeFile({ fileName: `${title.replace(/\s+/g, "_")}.pptx` });
}

/**
 * Презентацияны PDF форматына экспорттоо (html2canvas жана jspdf аркылуу)
 * Бул функция браузерде гана иштейт.
 */
export async function exportToPDF(containerId: string, filename: string) {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const element = document.getElementById(containerId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("l", "mm", "a4");
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${filename.replace(/\s+/g, "_")}.pdf`);
}

/**
 * Презентацияны сүрөт (PNG/JPG) форматына экспорттоо
 */
export async function exportToImage(containerId: string, filename: string, format: 'png' | 'jpeg' = 'png') {
  const html2canvas = (await import("html2canvas")).default;

  const element = document.getElementById(containerId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 3, // High quality
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL(`image/${format}`, 1.0);
  const link = document.createElement('a');
  link.download = `${filename.replace(/\s+/g, "_")}.${format}`;
  link.href = imgData;
  link.click();
}
