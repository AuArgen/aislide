import pptxgen from "pptxgenjs";
import { Slide, SlideElement } from "@/types/elements";

/** Helper to convert hex to 6-char string without # */
const toHex = (color?: string, def = "000000") => {
  if (!color) return def;
  const match = color.match(/#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/);
  if (match && match[1]) {
    const hex = match[1];
    return hex.length === 3
      ? hex.split("").map((c) => c + c).join("")
      : hex;
  }
  return def;
};

/**
 * Презентацияны PowerPoint (.pptx) форматына экспорттоо
 */
export async function exportToPPTX(title: string, slides: Slide[]) {
  const pptx = new pptxgen();

  // Документтин касиеттери
  pptx.title = title;
  pptx.subject = "AI Generated Presentation";
  pptx.author = "AI Slide Generator";

  // Force slide size to 16:9 widescreen (10x5.625 inches) strictly
  pptx.layout = "LAYOUT_16x9";

  slides.forEach((slideData) => {
    const slide = pptx.addSlide();

    // Background handling
    if (slideData.bg) {
      if (slideData.bg.type === 'solid') {
        slide.background = { color: toHex(slideData.bg.value, "FFFFFF") };
      } else if (slideData.bg.type === 'image') {
        slide.background = { path: slideData.bg.value };
      } else if (slideData.bg.type === 'gradient') {
        const match = slideData.bg.value.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/);
        slide.background = { color: match ? toHex(match[0]) : "FFFFFF" };
      }
    } else if (slideData.background) {
      if (slideData.background.startsWith('#')) {
        slide.background = { color: toHex(slideData.background, "FFFFFF") };
      } else if (slideData.background.includes('url(')) {
        const match = slideData.background.match(/url\(['"]?(.*?)['"]?\)/);
        if (match && match[1]) {
          slide.background = { path: match[1] };
        }
      }
    } else if (slideData.backgroundImage) {
      slide.background = { path: slideData.backgroundImage };
    }

    // Elements mapping
    slideData.elements.forEach((el) => {
      if (el.visible === false) return; // skip hidden

      // CSS pixels to Inches (1920x1080 -> 10x5.625)
      // 1 inch = 192px horizontally and 192px vertically
      const x = el.x / 1920 * 10;
      const y = el.y / 1080 * 5.625;
      const w = (el.width || 0) / 1920 * 10;
      const h = (el.height || 0) / 1080 * 5.625;

      if (el.type === 'text') {
        slide.addText(el.content, {
          x,
          y,
          w: w > 0 ? w : undefined,
          h: el.height ? h : undefined,
          fontSize: el.fontSize ? el.fontSize * 0.375 : 18, // 72 pts per inch / 192 px per inch = 0.375
          color: toHex(el.color, "000000"),
          align: el.align || 'left',
          bold: el.fontWeight === 'bold',
          italic: el.fontStyle === 'italic',
          underline: el.textDecoration === 'underline' ? { style: "sng" } : undefined,
          valign: 'top',
        });
      } else if (el.type === 'image') {
        slide.addImage({
          path: el.src,
          x,
          y,
          w,
          h,
        });
      } else if (el.type === 'shape') {
        let shapeType = pptx.ShapeType.rect;
        if (el.shapeKind === 'circle') shapeType = pptx.ShapeType.ellipse;
        else if (el.shapeKind === 'triangle') shapeType = pptx.ShapeType.triangle;
        else if (el.shapeKind === 'arrow-right') shapeType = pptx.ShapeType.rightArrow;
        else if (el.shapeKind === 'arrow-left') shapeType = pptx.ShapeType.leftArrow;
        else if (el.shapeKind === 'line') shapeType = pptx.ShapeType.line;
        else if (el.shapeKind === 'star') shapeType = pptx.ShapeType.star5;
        else if (el.shapeKind === 'hexagon') shapeType = pptx.ShapeType.hexagon;
        else if (el.shapeKind === 'diamond') shapeType = pptx.ShapeType.diamond;
        else if (el.shapeKind === 'cloud') shapeType = pptx.ShapeType.cloud;

        const shapeOpts: any = {
          x, y, w, h,
          fill: { color: toHex(el.fill, "CCCCCC") },
        };
        if (el.stroke && el.strokeWidth) {
          shapeOpts.line = {
            color: toHex(el.stroke),
            width: el.strokeWidth * 0.375,
            dashType: el.strokeStyle === 'dashed' ? 'dash' : 'solid'
          };
        }

        if (el.text) {
          // If shape has text, use addText with shape parameter
          slide.addText(el.text, {
            shape: shapeType,
            ...shapeOpts,
            color: toHex(el.textColor, "000000"),
            fontSize: el.textFontSize ? el.textFontSize * 0.375 : 18,
            align: el.textAlign || 'center',
            bold: el.textBold,
            italic: el.textItalic,
            valign: 'middle'
          });
        } else {
          slide.addShape(shapeType, shapeOpts);
        }
      }
    });
  });

  // Файлды жүктөө
  return pptx.writeFile({ fileName: `${title.replace(/\s+/g, "_")}.pptx` });
}

export async function exportToPDF(containerId: string, filename: string, totalSlides: number) {
  const htmlToImage = await import("html-to-image");
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF("l", "pt", [1920, 1080]);

  try {
    for (let i = 0; i < totalSlides; i++) {
      const slideElement = document.getElementById(`export-slide-${i}`);
      if (!slideElement) continue;

      // Add a slight delay to ensure all images, custom fonts, and backgrounds are fully rendered
      await new Promise(resolve => setTimeout(resolve, 800));

      const imgData = await htmlToImage.toPng(slideElement, {
        pixelRatio: 1, // Keep 1x because the container is already 1920x1080
        style: { transform: 'scale(1)', transformOrigin: 'top left' },
        width: 1920,
        height: 1080,
        skipFonts: false,
        // Removed backgroundColor: "#ffffff" to prevent color washing and overriding transparent backgrounds
      });

      if (i > 0) pdf.addPage([1920, 1080], "l");

      pdf.addImage(imgData, "PNG", 0, 0, 1920, 1080);
    }

    pdf.save(`${filename.replace(/\s+/g, "_")}.pdf`);
  } catch (e: any) {
    console.error('PDF export error:', e);
    throw new Error(e.message || 'Белгисиз ката');
  }
}

/**
 * Презентацияны сүрөт (PNG/JPG) форматына экспорттоо
 */
export async function exportToImage(containerId: string, filename: string, totalSlides: number, format: 'png' | 'jpeg' = 'png') {
  const htmlToImage = await import("html-to-image");

  try {
    const options = {
      pixelRatio: 1, // Keep 1x because nodes are already 1920x1080
      style: { transform: 'scale(1)', transformOrigin: 'top left' },
      width: 1920,
      height: 1080,
      skipFonts: false,
      // Removed backgroundColor: "#ffffff" to prevent color washing
    };

    // Export each slide individually as images wrapped in a ZIP, or download multiple files.
    // For simplicity, download multiple files iteratively with an index
    for (let i = 0; i < totalSlides; i++) {
      const slideElement = document.getElementById(`export-slide-${i}`);
      if (!slideElement) continue;

      // Add a slight delay before capture
      await new Promise(resolve => setTimeout(resolve, 800));

      const imgData = format === 'jpeg'
        ? await htmlToImage.toJpeg(slideElement, { ...options, quality: 1.0 })
        : await htmlToImage.toPng(slideElement, options);

      const link = document.createElement('a');
      const suffix = totalSlides > 1 ? `_${i + 1}` : '';
      link.download = `${filename.replace(/\s+/g, "_")}${suffix}.${format}`;
      link.href = imgData;
      link.click();

      // Add a tiny delay between downloads so the browser doesn't block them
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  } catch (e: any) {
    console.error('Image export error:', e);
    throw new Error(e.message || 'Белгисиз ката');
  }
}
