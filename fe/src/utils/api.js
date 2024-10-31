const API_ENDPOINT = 'http://localhost:5000/api/crop';

export const sendSelectionData = async (x, y, image) => {
  console.log('sendSelectionData', x, y);
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ x: Number(x.toFixed(3)), y: Number(y.toFixed(3)), image }),
    });
    const data = await response.json();
    console.log('Success:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};