"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Search, FileText, Download, Trash2 } from 'lucide-react';

interface FileRecord {
  id: string;
  name: string;
  public_url: string;
  category: string;
  description?: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchResults, setSearchResults] = useState<FileRecord[]>([]);

  const [uploadForm, setUploadForm] = useState({
    category: 'documents',
    description: ''
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'admin') {
      redirect('/login');
    }
    fetchFiles();
  }, [session, status]);

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/upload');
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', uploadForm.category);
    formData.append('description', uploadForm.description);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        await fetchFiles();
        setUploadForm({ category: 'documents', description: '' });
        event.target.value = '';
      } else {
        console.error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&category=${selectedCategory}`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Error searching files:', error);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/upload?id=${fileId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchFiles();
        setSearchResults(prev => prev.filter(f => f.id !== fileId));
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage file archives and system settings</p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="manage">Manage Files</TabsTrigger>
          <TabsTrigger value="search">Search Archive</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload New File</CardTitle>
              <CardDescription>Upload files to the archive for chatbot reference</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={uploadForm.category} onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="documents">Documents</SelectItem>
                    <SelectItem value="sheets">Spreadsheets</SelectItem>
                    <SelectItem value="images">Images</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the file content for easier searching..."
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <Button onClick={() => document.getElementById('file')?.click()} disabled={uploading}>
                {uploading ? 'Uploading...' : <><Upload className="w-4 h-4 mr-2" /> Upload File</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>File Archive</CardTitle>
              <CardDescription>Manage uploaded files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div>
                        <h3 className="font-medium">{file.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {file.category} • {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                        </p>
                        {file.description && (
                          <p className="text-sm text-muted-foreground mt-1">{file.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={file.public_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(file.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Search Archive</CardTitle>
              <CardDescription>Search for files by name or description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="documents">Documents</SelectItem>
                    <SelectItem value="sheets">Spreadsheets</SelectItem>
                    <SelectItem value="images">Images</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Search Results ({searchResults.length})</h3>
                  {searchResults.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <FileText className="w-8 h-8 text-green-500" />
                        <div>
                          <h3 className="font-medium">{file.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {file.category} • {formatFileSize(file.file_size)}
                          </p>
                          {file.description && (
                            <p className="text-sm text-muted-foreground mt-1">{file.description}</p>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={file.public_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
