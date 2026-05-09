export interface FileCard {
  sheetId: string;
  fileName: string;
  subject: string;
  subjectCode: string;
  semester: string;
  fileSize: string;
  pages: number;
  downloadUrl: string;
  source: 'telegram';
}

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
  fileCard?: FileCard;
  attachmentPreview?: string;
  attachmentName?: string;
}

export interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  unread: boolean;
}

export interface SubjectRow {
  id: string;
  code: string;
  name: string;
  semester: string;
}
