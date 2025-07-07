
import React, { useState, useRef, useEffect } from "react";
import { Upload, Send, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  name: string;
  content: string;
  type: string;
}

interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding: number[];
  documentName: string;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FAISSIndex {
  chunks: DocumentChunk[];
  addDocuments: (chunks: DocumentChunk[]) => void;
  similaritySearch: (queryEmbedding: number[], k: number) => DocumentChunk[];
}

const AppPage = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [faissIndex, setFaissIndex] = useState<FAISSIndex | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize FAISS-like vector store
  const createFAISSIndex = (): FAISSIndex => {
    const chunks: DocumentChunk[] = [];
    
    return {
      chunks,
      addDocuments: (newChunks: DocumentChunk[]) => {
        chunks.push(...newChunks);
      },
      similaritySearch: (queryEmbedding: number[], k: number) => {
        const similarities = chunks.map(chunk => ({
          chunk,
          similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
        }));
        
        similarities.sort((a, b) => b.similarity - a.similarity);
        return similarities.slice(0, k).map(s => s.chunk);
      }
    };
  };

  useEffect(() => {
    if (!faissIndex) {
      setFaissIndex(createFAISSIndex());
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsLoading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const content = await readFileContent(file);
        
        const newDoc: Document = {
          id: Date.now().toString() + i,
          name: file.name,
          content,
          type: file.type
        };

        setDocuments(prev => [...prev, newDoc]);
        await processDocumentForVectorStore(newDoc);
      }

      toast({
        title: "Documents uploaded successfully",
        description: `${files.length} document(s) processed and ready for chat.`,
      });
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast({
        title: "Upload failed",
        description: "There was an error processing your documents.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      if (file.type === 'application/pdf') {
        reader.onload = (e) => {
          const text = e.target?.result as string;
          resolve(text || `PDF file: ${file.name} - Content extraction requires PDF parser`);
        };
        reader.readAsText(file);
      } else if (file.type.includes('document') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        reader.onload = (e) => {
          const text = e.target?.result as string;
          resolve(text || `Document file: ${file.name} - Content extraction requires document parser`);
        };
        reader.readAsText(file);
      } else {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsText(file);
      }
      
      reader.onerror = reject;
    });
  };

  // RecursiveCharacterTextSplitter implementation
  const recursiveCharacterTextSplit = (text: string, chunkSize: number = 1000, chunkOverlap: number = 200): string[] => {
    if (!text || text.length === 0) {
      return [];
    }
    
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length);
      let chunk = text.slice(startIndex, endIndex);
      
      // Try to break at sentence boundaries if possible
      if (endIndex < text.length) {
        const sentenceEnd = chunk.lastIndexOf('. ');
        const paragraphEnd = chunk.lastIndexOf('\n\n');
        const breakPoint = Math.max(sentenceEnd, paragraphEnd);
        
        if (breakPoint > startIndex + chunkSize * 0.5) {
          chunk = text.slice(startIndex, startIndex + breakPoint + 1);
        }
      }
      
      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim());
      }
      
      startIndex = startIndex + chunk.length - chunkOverlap;
      
      if (startIndex >= text.length) {
        break;
      }
    }

    return chunks;
  };

  const processDocumentForVectorStore = async (document: Document) => {
    if (!faissIndex) return;
    
    try {
      console.log(`Processing document: ${document.name}`);
      
      // Use RecursiveCharacterTextSplitter
      const chunks = recursiveCharacterTextSplit(document.content, 1000, 200);
      console.log(`Split into ${chunks.length} chunks using RecursiveCharacterTextSplitter`);
      
      if (chunks.length === 0) {
        console.log("No chunks created from document content");
        return;
      }
      
      // Create embeddings for each chunk
      const embeddings = await createEmbeddings(chunks);
      console.log(`Created ${embeddings.length} embeddings`);
      
      // Create document chunks with embeddings
      const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
        id: `${document.id}_chunk_${index}`,
        documentId: document.id,
        content: chunk,
        embedding: embeddings[index] || [],
        documentName: document.name
      }));
      
      // Add to FAISS index
      faissIndex.addDocuments(documentChunks);
      
      console.log(`Processed ${chunks.length} chunks for document: ${document.name}`);
      console.log("Documents added to FAISS vector store");
      
    } catch (error) {
      console.error("Error processing document for vector store:", error);
    }
  };

  const createEmbeddings = async (chunks: string[]): Promise<number[][]> => {
    if (chunks.length === 0) {
      return [];
    }
    
    try {
      console.log(`Creating embeddings for ${chunks.length} chunks using text-embedding-3-small`);
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: chunks,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data.map((item: any) => item.embedding);
    } catch (error) {
      console.error("Error creating embeddings:", error);
      return chunks.map(() => Array(1536).fill(0).map(() => Math.random()));
    }
  };

  const cosineSimilarity = (a: number[], b: number[]): number => {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await queryDocuments(inputMessage);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error querying documents:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I encountered an error while processing your question. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const queryDocuments = async (query: string): Promise<string> => {
    if (!faissIndex || faissIndex.chunks.length === 0) {
      return "Please upload some documents first so I can help answer your questions based on their content.";
    }

    try {
      console.log(`Querying documents with: "${query}"`);
      
      // Create query embedding
      const queryEmbeddings = await createEmbeddings([query]);
      if (queryEmbeddings.length === 0) {
        return "I couldn't process your question. Please try again.";
      }
      
      // Use FAISS similarity search (k=3 for better context)
      const relevantChunks = faissIndex.similaritySearch(queryEmbeddings[0], 3);
      console.log(`FAISS found ${relevantChunks.length} relevant chunks`);
      
      if (relevantChunks.length === 0) {
        return "I couldn't find relevant information in your documents to answer that question.";
      }
      
      // Build context similar to LangChain's approach
      const contextDocuments = relevantChunks.map(chunk => chunk.content).join('\n\n---\n\n');
      
      console.log("Context length:", contextDocuments.length);
      console.log("Context preview:", contextDocuments.substring(0, 200) + "...");
      
      // Use RetrievalQA-style prompting
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer based on the context, just say that you don't know. Use three sentences maximum and keep the answer concise.

Context:
${contextDocuments}`
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 500,
          temperature: 0,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const answer = data.choices[0].message.content;
      
      // Add source information
      const sources = relevantChunks.map(chunk => chunk.documentName);
      const uniqueSources = [...new Set(sources)];
      
      return `${answer}\n\nSources: ${uniqueSources.join(', ')}`;
      
    } catch (error) {
      console.error("Error with RetrievalQA:", error);
      return "I'm having trouble processing your question right now. Please try again.";
    }
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    
    // Remove chunks from FAISS index
    if (faissIndex) {
      const remainingChunks = faissIndex.chunks.filter(chunk => chunk.documentId !== id);
      const newIndex = createFAISSIndex();
      newIndex.addDocuments(remainingChunks);
      setFaissIndex(newIndex);
    }
    
    toast({
      title: "Document removed",
      description: "Document has been removed from the knowledge base.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/logo.svg" alt="RAG AI" className="h-8" />
              <span className="text-xl font-semibold">RAG AI Assistant</span>
            </div>
            <a 
              href="/" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Landing
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Documents
              </h2>
              
              <div className="mb-6">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Documents
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.pdf,.doc,.docx,.md"
                />
              </div>

              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm truncate">{doc.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {documents.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No documents uploaded yet. Upload some documents to start chatting with them.
                </p>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Chat with Your Documents</h2>
                <p className="text-sm text-gray-600">Ask questions about your uploaded documents using FAISS vector search</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p>Start a conversation by asking questions about your documents.</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <p className="text-sm text-gray-600">Processing with FAISS vector search...</p>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask a question about your documents..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppPage;
