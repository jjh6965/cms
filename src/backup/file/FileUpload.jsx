import React from 'react';
import { fetchData } from '../../utils/dataUtils';
import api from '../../utils/api';
import common from '../../utils/common';

const FileUpload = () => {
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      const fileContent = event.target.result;
      try {
        const res = await fetchData(api, `${common.getServerUrl('file/create')}?module=notice&filename=${encodeURIComponent(file.name)}`, fileContent, {
          headers: { 'Content-Type': 'application/octet-stream' }
        });
        alert(`File uploaded: ${res.id}`);
      } catch (error) {
        alert('Upload failed: ' + (error.message || 'Unknown error'));
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return <input type="file" onChange={handleUpload} />;
};

export default FileUpload;