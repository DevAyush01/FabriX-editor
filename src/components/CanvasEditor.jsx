import React, { useEffect, useRef, useState } from 'react';
import {fabric} from 'fabric';
import toast, { Toaster } from 'react-hot-toast';

function CanvasEditor({ imageUrl, onClose }) {
  const canvasContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [textContent, setTextContent] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [shapeColor, setShapeColor] = useState('#ff0000');
  const [layers, setLayers] = useState([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
const [downloadError, setDownloadError] = useState(null);

  
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

  
    const containerWidth = container.clientWidth;
    const containerHeight = window.innerHeight * 0.7; 
    const newWidth = Math.min(containerWidth - 40, 1200);
    const newHeight = Math.min(containerHeight, 800); 

    setCanvasSize({ width: newWidth, height: newHeight });

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: newWidth,
      height: newHeight,
      backgroundColor: '#f0f0f0',
    });
    fabricCanvasRef.current = canvas;

    // Load image with proper scaling
    fabric.Image.fromURL(imageUrl, (img) => {
      // Scale image to fit canvas while maintaining aspect ratio
      const scale = Math.min(
        (newWidth * 0.9) / img.width,
        (newHeight * 0.9) / img.height
      );
      img.scale(scale);
      canvas.centerObject(img);
      canvas.add(img);
      canvas.sendToBack(img);
      canvas.renderAll();
      logLayers(canvas);
    }, {
      crossOrigin: 'anonymous' // Important for downloading canvas with images
    });

    // Set up event listeners
    canvas.on('object:modified', () => logLayers(canvas));
    canvas.on('object:added', () => logLayers(canvas));
    canvas.on('object:removed', () => logLayers(canvas));

    // Handle window resize
    const handleResize = () => {
      if (!container) return;
      const newWidth = Math.min(container.clientWidth - 40, 1200);
      const newHeight = Math.min(window.innerHeight * 0.7, 800);
      
      setCanvasSize({ width: newWidth, height: newHeight });
      canvas.setDimensions({ width: newWidth, height: newHeight });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, [imageUrl]);

  
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.setDimensions(canvasSize);
    fabricCanvasRef.current.renderAll();
  }, [canvasSize]);

  const logLayers = (canvas) => {
    const layerData = canvas.getObjects().map((obj) => ({
      type: obj.type,
      properties: obj.toObject(),
    }));
    setLayers(layerData);
  };

  const validateTextInput = (text) => {
    if (text.length > 100) {
      toast.error('Text too long (max 100 characters)');
      return false;
    }
    if (text.trim().length === 0) {
      toast.error('Please enter some text');
      return false;
    }
    return true;
  };

  const addText = () => {
    if (!validateTextInput(textContent)) return;

    try {
    const canvas = fabricCanvasRef.current;
    const text = new fabric.IText(textContent, {
      left: canvas.width / 2,
      top: canvas.height / 2,
      fontFamily: 'Arial',
      fontSize: 20,
      fill: textColor,
      hasControls: true,
      hasBorders: true,
      lockScalingFlip: true,
      originX: 'center',
      originY: 'center',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setTextContent('');
    setError(null); 
  } catch (error) {
    toast.error('Error adding text');
  }
};

  const addShape = (shapeType) => {
    const canvas = fabricCanvasRef.current;
    let shape;

    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({
          width: 100,
          height: 60,
          fill: shapeColor,
          left: canvas.width / 2,
          top: canvas.height / 2,
          originX: 'center',
          originY: 'center',
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          radius: 50,
          fill: shapeColor,
          left: canvas.width / 2,
          top: canvas.height / 2,
          originX: 'center',
          originY: 'center',
        });
        break;
      case 'triangle':
        shape = new fabric.Triangle({
          width: 100,
          height: 100,
          fill: shapeColor,
          left: canvas.width / 2,
          top: canvas.height / 2,
          originX: 'center',
          originY: 'center',
        });
        break;
      case 'polygon':
        shape = new fabric.Polygon([
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 50, y: 100 }
        ], {
          fill: shapeColor,
          left: canvas.width / 2,
          top: canvas.height / 2,
          originX: 'center',
          originY: 'center',
        });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  };

  const downloadImage = async () => {
    if (!fabricCanvasRef.current) {
      setDownloadError('Canvas not ready');
      return;
    }
    setIsDownloading(true);
    setDownloadError(null);

     try {
    const canvas = fabricCanvasRef.current;
    if (canvas.getObjects().length === 0) {
      throw new Error('Nothing to download');
    }

    await new Promise((resolve) => {
      canvas.clone((clonedCanvas) => {
        try {
          const dataURL = clonedCanvas.toDataURL({
            format: 'png',
            quality: 1,
          });
          
          const link = document.createElement('a');
          link.download = `edited-${Date.now()}.png`;
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          resolve();
        } catch (error) {
          throw new Error('Failed to generate image');
        }
      });
    });
  } catch (error) {
    setDownloadError(error.message);
  } finally {
    setIsDownloading(false);
  }
};

  const bringForward = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas.getActiveObject();
    if (obj) {
      canvas.bringForward(obj);
      canvas.renderAll();
    }
  };

  const sendBackward = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas.getActiveObject();
    if (obj) {
      canvas.sendBackwards(obj);
      canvas.renderAll();
    }
  };

  const deleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.renderAll();
    }
  };

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={onClose}>Back to Search</button>
      </div>
    );
  }

  return (
    <div className="canvas-editor">
      <Toaster/>
      <div className="editor-header">
        <h2>Image Editor</h2>
        <button className="close-button" onClick={onClose}>Back to Search</button>
      </div>

      <div className="editor-container">
        <div className="tool-panel">
          <div className="tool-section">
            <h3>Add Captions</h3>
            <input
              type="text"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter text"
            />
            <div className="color-picker">
              <label>Text Color:</label>
              <input 
                type="color" 
                value={textColor} 
                onChange={(e) => setTextColor(e.target.value)} 
              />
            </div>
            <button onClick={addText}>Add Text</button>
          </div>

          <div className="tool-section">
            <h3>Shapes</h3>
            <div className="color-picker">
              <label>Shape Color:</label>
              <input 
                type="color" 
                value={shapeColor} 
                onChange={(e) => setShapeColor(e.target.value)} 
              />
            </div>
            <div className="shape-buttons">
              <button onClick={() => addShape('rectangle')}>Rectangle</button>
              <button onClick={() => addShape('circle')}>Circle</button>
              <button onClick={() => addShape('triangle')}>Triangle</button>
              <button onClick={() => addShape('polygon')}>Polygon</button>
            </div>
          </div>

          <div className="tool-section">
            <h3>Layer Controls</h3>
            <button onClick={bringForward}>Bring Forward</button>
            <button onClick={sendBackward}>Send Backward</button>
            <button className="delete-button" onClick={deleteSelected}>Delete Selected</button>
          </div>

          <button className="download-button" onClick={downloadImage}>Download Image</button>
        </div>

        <div className="canvas-wrapper" ref={canvasContainerRef}>
          <canvas 
            ref={canvasRef} 
            width={canvasSize.width} 
            height={canvasSize.height} 
          />
        </div>

        <div className="layers-panel">
          <h3>Layers</h3>
          <div className="layers-list">
            {layers.map((layer, index) => (
              <div 
                key={index} 
                className="layer-item"
                onClick={() => {
                  const canvas = fabricCanvasRef.current;
                  canvas.setActiveObject(canvas.item(index));
                  canvas.renderAll();
                }}
              >
                <span className="layer-type">{layer.type}</span>
                <span className="layer-props">
                  {layer.type === 'i-text' && `"${layer.properties.text}"`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CanvasEditor;