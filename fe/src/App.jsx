import { useState } from 'react';
import ImageObjectSelector from './components/ImageObjectSelector';
import CroppedImages from './components/CroppedImages';
import { sendSelectionData } from './utils/api';
import styles from './styles/App.module.css';

const App = () => {
  const [croppedImages, setCroppedImages] = useState([]);
  const [canSelectNewObject, setCanSelectNewObject] = useState(false);
  const [lastProcessedImage, setLastProcessedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [responseTime, setResponseTime] = useState(null);

  const handleDataSubmit = async (x, y, image) => {
    setIsLoading(true);
    try {
      const startTime = Date.now();
      const result = await sendSelectionData(x, y, image);
      const endTime = Date.now();
      const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
      setResponseTime(timeTaken);
      if (Array.isArray(result) && result.length > 0) {
        setCroppedImages(result);
        setCanSelectNewObject(true);
        setLastProcessedImage(image);
      } else {
        console.log('No images returned from the API');
        setCroppedImages([]);
        setCanSelectNewObject(false);
      }
    } catch (error) {
      console.error('Error submitting data:', error);
      setCroppedImages([]);
      setCanSelectNewObject(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewFileSelected = () => {
    setResponseTime(null);
    setCroppedImages([]);
    setCanSelectNewObject(false);
    setLastProcessedImage(null);
  };

  return (
    <div>
      <div className={styles.header}>
      <h1>Object Selector</h1>
      {responseTime && (
        <div className={styles.timer}>
          API Response Time: {responseTime} seconds
        </div>
      )}
      </div>
      <div className={styles.container}>
        <ImageObjectSelector 
          onDataSubmit={handleDataSubmit} 
          canSelectNewObject={canSelectNewObject}
          lastProcessedImage={lastProcessedImage}
          isLoading={isLoading}
          onNewFileSelected={handleNewFileSelected}
        />
        {croppedImages.length > 0 && <CroppedImages images={croppedImages} />}
      </div>
    </div>
  );
};

export default App;