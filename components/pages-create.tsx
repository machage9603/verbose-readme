'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Sun, Moon, Download, Copy, Save, Github, ChevronDown, ChevronUp } from 'lucide-react'
import Gemini from "gemini-ai";
import fetch from 'node-fetch';


const licenses = [
  { value: 'mit', label: 'MIT License' },
  { value: 'apache', label: 'Apache License 2.0' },
  { value: 'gpl', label: 'GNU General Public License v3.0' },
  { value: 'bsd', label: 'BSD 3-Clause License' },
]

const templates = [
  { value: 'basic', label: 'Basic README' },
  { value: 'project', label: 'Project README' },
  { value: 'library', label: 'Library README' },
]

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  license: z.string().min(1, 'Please select a license'),
  template: z.string().min(1, 'Please select a template'),
  installation: z.string().optional(),
  usage: z.string().optional(),
  contributing: z.string().optional(),
})

export function PagesCreate() {
  const { theme, setTheme } = useTheme()
  const [readmeContent, setReadmeContent] = useState('')
  const [savedReadmes, setSavedReadmes] = useState([])
  const [isLicenseDropdownOpen, setIsLicenseDropdownOpen] = useState(false)
  const { toast } = useToast()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      template: 'basic',
      license: '',
    },
  })

  const watchedFields = watch()

  useEffect(() => {
    const storedReadmes = localStorage.getItem('savedReadmes')
    if (storedReadmes) {
      setSavedReadmes(JSON.parse(storedReadmes))
    }
  }, [])

  interface ReadmeData {
    title: string;
    description: string;
    license: string;
    template: string;
    installation?: string;
    usage?: string;
    contributing?: string;
  }


  const generateReadme = (data: ReadmeData) => {
    const { title, description, license, template, installation, usage, contributing } = data
    let content = ''

    switch (template) {
      case 'basic':
        content = `
# ${title}

${description}

## License

This project is licensed under the ${licenses.find(l => l.value === license)?.label || 'MIT License'}.
        `
        break
      case 'project':
        content = `
# ${title}

${description}

## Installation

${installation || 'TODO: Add installation instructions'}

## Usage

${usage || 'TODO: Add usage information'}

## Contributing

${contributing || 'TODO: Add contribution guidelines'}

## License

This project is licensed under the ${licenses.find(l => l.value === license)?.label || 'MIT License'}.
        `
        break
      case 'library':
        content = `
# ${title}

${description}

## Installation

\`\`\`
npm install ${title.toLowerCase().replace(/\s+/g, '-')}
\`\`\`

## Usage

\`\`\`javascript
const ${title.toLowerCase().replace(/\s+/g, '')} = require('${title.toLowerCase().replace(/\s+/g, '-')}');

// TODO: Add usage example
\`\`\`

## API

TODO: Document the library's API

## Contributing

${contributing || 'TODO: Add contribution guidelines'}

## License

This project is licensed under the ${licenses.find(l => l.value === license)?.label || 'MIT License'}.
        `
        break
    }

    setReadmeContent(content)
  }


type FieldType = 'title' | 'description' | 'license' | 'template' | 'installation' | 'usage' | 'contributing';

const aiSuggest = async (field: FieldType): Promise<string> => {
  const apiUrl = 'https://gemini.googleapis.com/v1/suggestions'; // Replace with actual URL
  const apiKey = 'YOUR_GEMINI_API_KEY'; // Replace with your actual API key

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ field }),
    });

    if (!response.ok) {
      throw new Error('AI service request failed');
    }

    const data = await response.json();
    return data.suggestion; // Adjust based on actual API response format
  } catch (error) {
    console.error('Error fetching AI suggestion:', error);
    return 'Default suggestion'; // Fallback suggestion in case of an error
  }
};

// Usage
aiSuggest('title').then((suggestion) => {
  console.log('AI suggestion:', suggestion);
});


  const saveReadme = () => {
    const newReadme = { id: Date.now(), title: watchedFields.title, content: readmeContent }
    const updatedReadmes = [...savedReadmes, newReadme]
    setSavedReadmes(updatedReadmes)
    localStorage.setItem('savedReadmes', JSON.stringify(updatedReadmes))
    toast({
      title: 'README Saved',
      description: 'Your README has been saved successfully.',
    })
  }

  const loadReadme = (id) => {
    const readme = savedReadmes.find(r => r.id === id)
    if (readme) {
      setReadmeContent(readme.content)
      setValue('title', readme.title)
      toast({
        title: 'README Loaded',
        description: 'Your saved README has been loaded.',
      })
    }
  }

  const downloadReadme = () => {
    const element = document.createElement('a')
    const file = new Blob([readmeContent], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = 'README.md'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(readmeContent).then(() => {
      toast({
        title: 'Copied!',
        description: 'README content copied to clipboard',
      })
    }, () => {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy content. Please try again.',
        variant: 'destructive',
      })
    })
  }

  const toggleLicenseDropdown = () => {
    setIsLicenseDropdownOpen(!isLicenseDropdownOpen)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-indigo-600 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold text-white mb-8"
      >
        READMEaker
      </motion.div>
      <div className="w-full max-w-7xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <form onSubmit={handleSubmit(generateReadme)} className="space-y-4">
            <div className="flex space-x-2">
              <Input
                {...register('title')}
                placeholder="Project Title"
                className="w-full"
              />
              <Button type="button" onClick={() => aiSuggest('title')} variant="outline">AI Suggest</Button>
            </div>
            {errors.title && <p className="text-red-500">{errors.title.message}</p>}

            <div className="flex space-x-2">
              <Textarea
                {...register('description')}
                placeholder="Project Description"
                className="w-full h-32"
              />
              <Button type="button" onClick={() => aiSuggest('description')} variant="outline">AI Suggest</Button>
            </div>
            {errors.description && <p className="text-red-500">{errors.description.message}</p>}

            <div className="relative">
              <Button
                type="button"
                onClick={toggleLicenseDropdown}
                className="w-full flex justify-between items-center"
                variant="outline"
              >
                {watchedFields.license ? licenses.find(l => l.value === watchedFields.license)?.label : 'Select License'}
                {isLicenseDropdownOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <AnimatePresence>
                {isLicenseDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg"
                  >
                    {licenses.map((license) => (
                      <button
                        key={license.value}
                        type="button"
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => {
                          setValue('license', license.value)
                          setIsLicenseDropdownOpen(false)
                        }}
                      >
                        {license.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {errors.license && <p className="text-red-500">{errors.license.message}</p>}

            <select
              {...register('template')}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {templates.map((template) => (
                <option key={template.value} value={template.value}>
                  {template.label}
                </option>
              ))}
            </select>
            {errors.template && <p className="text-red-500">{errors.template.message}</p>}

            {watchedFields.template !== 'basic' && (
              <>
                <div className="flex space-x-2">
                  <Textarea
                    {...register('installation')}
                    placeholder="Installation Instructions"
                    className="w-full h-32"
                  />
                  <Button type="button" onClick={() => aiSuggest('installation')} variant="outline">AI Suggest</Button>
                </div>

                <div className="flex space-x-2">
                  <Textarea
                    {...register('usage')}
                    placeholder="Usage Information"
                    className="w-full h-32"
                  />
                  <Button type="button" onClick={() => aiSuggest('usage')} variant="outline">AI Suggest</Button>
                </div>

                <div className="flex space-x-2">
                  <Textarea
                    {...register('contributing')}
                    placeholder="Contribution Guidelines"
                    className="w-full h-32"
                  />
                  <Button type="button" onClick={() => aiSuggest('contributing')} variant="outline">AI Suggest</Button>
                </div>
              </>
            )}

            <Button type="submit" className="w-full">Generate README</Button>
          </form>

          <div className="flex justify-between items-center">
            <Button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              variant="outline"
              size="icon"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button onClick={saveReadme} variant="outline">
              <Save className="mr-2 h-4 w-4" /> Save README
            </Button>
          </div>

          {savedReadmes.length > 0 && (
            <div>
              <h3 className="font-bold mb-2">Saved READMEs</h3>
              <ul className="space-y-2">
                {savedReadmes.map((readme) => (
                  <li key={readme.id} className="flex justify-between items-center">
                    <span>{readme.title}</span>
                    <Button onClick={() => loadReadme(readme.id)} variant="outline" size="sm">Load</Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="preview">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="github">GitHub Style</TabsTrigger>
            </TabsList>
            <TabsContent value="preview">
              <Card>
                <CardContent className="p-4">
                  <ReactMarkdown className="prose dark:prose-invert max-w-none">
                    {readmeContent}
                  </ReactMarkdown>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="github">
              <Card>
                <CardContent className="p-4 bg-white dark:bg-gray-900">
                  <div className="border rounded-md p-4 prose dark:prose-invert max-w-none" style={{ fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji' }}>
                    <ReactMarkdown>{readmeContent}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end space-x-2">
            <Button onClick={downloadReadme} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            <Button onClick={copyToClipboard} variant="outline">
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}