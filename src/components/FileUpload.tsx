import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Archive, 
  X,
  Download,
  Eye
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void
  existingFiles?: UploadedFile[]
  maxFiles?: number
  maxSize?: number // em MB
  acceptedTypes?: string[]
}

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  file?: File
  uploading?: boolean
  progress?: number
}

export function FileUpload({ 
  onFilesChange, 
  existingFiles = [], 
  maxFiles = 10,
  maxSize = 10,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt']
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles)
  const [isDragOver, setIsDragOver] = useState(false)
  const { toast } = useToast()

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo ${maxSize}MB`
    }
    
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''))
      }
      return file.type === type || file.name.toLowerCase().endsWith(type)
    })
    
    if (!isValidType) {
      return 'Tipo de arquivo não suportado'
    }
    
    return null
  }

  const handleFiles = useCallback((newFiles: FileList) => {
    const validFiles: UploadedFile[] = []
    
    Array.from(newFiles).forEach(file => {
      if (files.length + validFiles.length >= maxFiles) {
        toast({
          title: 'Limite de arquivos atingido',
          description: `Máximo de ${maxFiles} arquivos permitidos`,
          variant: 'destructive'
        })
        return
      }

      const error = validateFile(file)
      if (error) {
        toast({
          title: 'Erro no arquivo',
          description: `${file.name}: ${error}`,
          variant: 'destructive'
        })
        return
      }

      const uploadedFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        uploading: false,
        progress: 0
      }

      validFiles.push(uploadedFile)
    })

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles]
      setFiles(updatedFiles)
      onFilesChange(updatedFiles)
    }
  }, [files, maxFiles, maxSize, acceptedTypes, toast, onFilesChange])

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id)
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${files.length >= maxFiles ? 'opacity-50 pointer-events-none' : 'hover:border-primary/50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Arraste arquivos aqui ou clique para selecionar
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Máximo {maxFiles} arquivos, {maxSize}MB cada
        </p>
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
          disabled={files.length >= maxFiles}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={files.length >= maxFiles}
        >
          Selecionar Arquivos
        </Button>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Arquivos ({files.length})</h4>
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                {getFileIcon(file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
                {file.uploading && (
                  <Progress value={file.progress} className="h-1 mt-1" />
                )}
              </div>
              <div className="flex items-center gap-1">
                {file.url && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const a = document.createElement('a')
                        a.href = file.url!
                        a.download = file.name
                        a.click()
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
