import { useState, useRef, useEffect } from 'react';
import { Upload, Loader } from 'lucide-react';
import styles from '../styles/ImageSelector.module.css';

const ImageObjectSelector = ({
  onDataSubmit,
  canSelectNewObject,
  lastProcessedImage,
  isLoading,
  onNewFileSelected,
}) => {
  const [imageSrc, setImageSrc] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [circle, setCircle] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isSelecting) {
        setIsSelecting(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelecting]);

  useEffect(() => {
    if (canSelectNewObject && lastProcessedImage) {
      setImageSrc(lastProcessedImage);
      // Don't reset the circle here
      setIsSelecting(false);
    }
  }, [canSelectNewObject, lastProcessedImage]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target.result);
        setCircle(null); // Reset circle only when new file is selected
        setIsSelecting(false);
        onNewFileSelected();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
  };

  const toggleSelectMode = () => {
    if (!isLoading) {
      setIsSelecting(!isSelecting);
      if (!isSelecting) {
        // Only reset the circle when entering selection mode
        setCircle(null);
      }
    }
  };

  const captureImage = () => {
    if (imageRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = imageRef.current.naturalWidth;
      canvas.height = imageRef.current.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageRef.current, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    return null;
  };

  const handleImageClick = (e) => {
    if (!isSelecting || isLoading) return;

    e.preventDefault();

    const rect = imageRef.current.getBoundingClientRect();
    const x = imageDimensions.width * ((e.clientX - rect.left) / rect.width);
    const y = imageDimensions.height * ((e.clientY - rect.top) / rect.height);

    setCircle({ x, y });
    setIsSelecting(false);

    const imageData = captureImage();
    if (imageData) {
      onDataSubmit(x, y, imageData);
    }

    console.log(`{x: ${x}, y: ${y}}`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result);
        setCircle(null);
        setIsSelecting(false);
        onNewFileSelected();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDropZoneClick = () => {
    if (isSelecting) return;
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.leftSide}>
      <h2>Original Image</h2>
      <div
        className={styles.dropZone}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleDropZoneClick}
      >
        {imageSrc ? (
          <div className={styles.imageContainer}>
            <img
              ref={imageRef}
              src={imageSrc}
              alt='Selectable Image'
              className={`${styles.selectableImage} ${
                isSelecting ? styles.selecting : ''
              }`}
              onClick={handleImageClick}
              onLoad={handleImageLoad}
            />
            {circle && (
              <div
                className={styles.selectionCircle}
                style={{
                  left: `${(circle.x / imageDimensions.width) * 100}%`,
                  top: `${(circle.y / imageDimensions.height) * 100}%`,
                }}
              />
            )}
          </div>
        ) : (
          <div className={styles.uploadPrompt}>
            <Upload className={styles.uploadIcon} />
            <p>Click to upload or drag and drop an image</p>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className={styles.hiddenCanvas} />
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        onChange={handleFileChange}
        disabled={isLoading}
        className={styles.hiddenInput}
      />
      <div className={styles.buttonGroup}>
        <button
          onClick={toggleSelectMode}
          disabled={!imageSrc || isLoading}
          className={styles.button}
        >
          {isLoading ? (
            <>
              <Loader className={styles.spinner} />
              Processing...
            </>
          ) : isSelecting ? (
            'Cancel'
          ) : (
            'Select Object'
          )}
        </button>
      </div>
    </div>
  );
};

export default ImageObjectSelector;
