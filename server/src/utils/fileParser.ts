import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import path from 'path';
import { AppError } from '../middleware/errorHandler.middleware';
import { logger } from '../config/logger';

export interface ParsedFileResult {
  text: string;
  metadata: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    pages?: number;
  };
}

export class FileParser {
  public static async parse(file: Express.Multer.File): Promise<ParsedFileResult> {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;
    let extractedText = '';
    let pages: number | undefined;

    logger.info({ filename: file.originalname, mimeType, size: file.size, ext }, 'Starting file parsing');

    try {
      if (ext === '.txt' || mimeType.includes('text/plain')) {
        extractedText = file.buffer.toString('utf-8');
      } else if (ext === '.pdf' || mimeType.includes('pdf')) {
        const data = await pdfParse(file.buffer);
        extractedText = data.text || '';
        pages = data.numpages;

        if (!extractedText.trim()) {
          throw new AppError(
            'The uploaded PDF appears to be empty or contains scanned images without selectable text. Scanned PDFs require OCR, which is not supported.',
            400
          );
        }
      } else if (
        ext === '.docx' ||
        mimeType.includes('vnd.openxmlformats-officedocument.wordprocessingml.document') ||
        mimeType.includes('msword')
      ) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = result.value || '';
        if (result.messages && result.messages.length > 0) {
          logger.warn({ messages: result.messages }, 'Mammoth docx extraction warnings');
        }
      } else {
        throw new AppError(
          `Unsupported file format: ${ext}. Only .txt, .pdf, and .docx files are supported.`,
          400
        );
      }

      // Clean up whitespace
      extractedText = extractedText.replace(/\r\n/g, '\n').trim();

      if (!extractedText) {
        throw new AppError('The document contains no readable text content.', 400);
      }

      logger.info({ filename: file.originalname, charLength: extractedText.length, pages }, 'File parsed successfully');

      return {
        text: extractedText,
        metadata: {
          filename: file.filename || file.originalname,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path || file.originalname,
          pages
        }
      };
    } catch (err: any) {
      if (err instanceof AppError) {
        throw err;
      }
      logger.error({ err, filename: file.originalname }, 'Error parsing uploaded file');
      throw new AppError(`Failed to extract text from ${file.originalname}: ${err.message}`, 400);
    }
  }
}
