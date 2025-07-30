import React from 'react';
import { fetchData } from '../../utils/dataUtils';
import api from '../../utils/api';
import common from '../../utils/common';

const ExcelUpload = () => {
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('excel', file);
    try {
      const res = await fetchData(api, common.getServerUrl('auth/login/excel/upload'), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.message);
    } catch (error) {
      alert('Upload failed: ' + (error.message || 'Unknown error'));
    }
  };

  return <input type="file" accept=".xlsx" onChange={handleUpload} />;
};

export default ExcelUpload;