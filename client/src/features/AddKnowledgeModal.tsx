import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { useProject } from '../context/ProjectContext';
import { api } from '../lib/api';
import { KnowledgeSourceType } from '../types/shared';
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface AddKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddKnowledgeModal: React.FC<AddKnowledgeModalProps> = ({ isOpen, onClose }) => {
  const { projects, selectedProjectId } = useProject();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [projectId, setProjectId] = useState<string>(selectedProjectId || '');
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState<KnowledgeSourceType>('Meeting Notes');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync selected project ID
  React.useEffect(() => {
    if (selectedProjectId) {
      setProjectId(selectedProjectId);
    } else if (projects.length > 0) {
      setProjectId(projects[0]._id);
    }
  }, [selectedProjectId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!projectId) {
      setError('Please select a project');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a document title');
      return;
    }

    try {
      setIsLoading(true);

      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (activeTab === 'paste') {
        if (!content.trim()) {
          setError('Please paste or write knowledge text content');
          setIsLoading(false);
          return;
        }

        await api.post(`/projects/${projectId}/knowledge`, {
          title,
          sourceType,
          originalText: content,
          author: author.trim() || undefined,
          tags: parsedTags
        });
      } else {
        if (!file) {
          setError('Please select a .txt, .pdf, or .docx document to upload');
          setIsLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('sourceType', sourceType);
        if (author.trim()) formData.append('author', author.trim());
        formData.append('tags', JSON.stringify(parsedTags));

        await api.post(`/projects/${projectId}/knowledge/upload`, formData);
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });

      // Reset
      setTitle('');
      setContent('');
      setFile(null);
      setAuthor('');
      setTags('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add knowledge source');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const ext = selected.name.toLowerCase();
      if (!ext.endsWith('.txt') && !ext.endsWith('.pdf') && !ext.endsWith('.docx')) {
        setError('Unsupported format. Please upload .txt, .pdf, or .docx file.');
        setFile(null);
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        setError('File exceeds maximum 10MB limit.');
        setFile(null);
        return;
      }
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
      setError(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Knowledge Source"
      description="Ingest team meeting notes, architectural decisions, technical docs, or project updates."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'paste'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Paste Text Content
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload Document (TXT, PDF, DOCX)
          </button>
        </div>

        {/* Project & Source Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Target Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              required
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Source Type</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as KnowledgeSourceType)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            >
              <option value="Meeting Notes">Meeting Notes</option>
              <option value="Project Update">Project Update</option>
              <option value="Technical Documentation">Technical Documentation</option>
              <option value="Decision">Decision Record</option>
              <option value="Handover">Handover Note</option>
              <option value="General Note">General Note</option>
              <option value="Imported Document">Imported Document</option>
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Document Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Razorpay Integration Sync & Webhook Architecture"
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            required
          />
        </div>

        {/* Paste or Upload Content */}
        {activeTab === 'paste' ? (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Document Content (Original Text)
            </label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste raw meeting notes, decision minutes, or handover text..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              required
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Upload File</label>
            <div className="border-2 border-dashed border-slate-200 hover:border-brand-500/50 rounded-xl p-6 text-center bg-slate-50/50 transition-colors">
              <input
                type="file"
                id="file-upload"
                accept=".txt,.pdf,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="w-8 h-8 text-brand-600 mb-2" />
                <span className="text-xs font-semibold text-slate-700">
                  {file ? file.name : 'Click to select or drag and drop document'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Supports TXT, PDF, DOCX up to 10MB (Standard text extraction)
                </span>
                {file && (
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {(file.size / 1024).toFixed(1)} KB ready
                  </span>
                )}
              </label>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 italic">
              * Note: Scanned image PDFs without digital text streams require OCR, which is not supported in this version.
            </p>
          </div>
        )}

        {/* Author & Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Author / Contributor (Optional)
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. Payments, Razorpay, QA"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Save Knowledge Source
          </Button>
        </div>
      </form>
    </Modal>
  );
};
