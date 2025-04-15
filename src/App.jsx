import React, { useState } from 'react'
import SearchImages from './components/SearchImages'
import './styles.css'
import CanvasEditor from './components/CanvasEditor';

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  return (
    <div className='App'>
      <h1 className='Heading'>Images</h1>
      {selectedImage ? (
        <CanvasEditor
        imageUrl={selectedImage.webformatURL}
        onClose={() => setSelectedImage(null)}
        />
      ) : (
        <SearchImages onSelectImage={setSelectedImage}/>
      )}
      
    </div>
  )
}
