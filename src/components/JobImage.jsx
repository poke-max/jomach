import React, { useState, useEffect } from 'react';
import { storageService } from '../firebase/storageService';

const JobImage = ({ job, className, onError, onLoad, fallbackContent }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      setLoading(true);
      setError(false);
      
      try {
        let url = job.imageUrl || job.url;
        
        if (url && url.startsWith('gs://')) {
          url = await storageService.convertGsUrlToDownloadUrl(url);
        }
        
        if (url) {
          setImageUrl(url);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error loading image for job:', job.id, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [job.imageUrl, job.url, job.id]);

  if (loading) {
    return (
      <div className={`${className} bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center`}>
        <div className="animate-pulse text-white text-xs">Cargando...</div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return fallbackContent || (
      <div className={`${className} bg-gradient-to-br from-[#D361A5] to-[#673AB7] flex items-center justify-center`}>
        <span className="text-white text-xs font-bold">
          {job.company?.charAt(0) || 'J'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={job.title}
      className={className}
      onError={(e) => {
        console.log('Error loading image:', imageUrl);
        setError(true);
        onError?.(e);
      }}
      onLoad={(e) => {
        console.log('Image loaded successfully:', imageUrl);
        onLoad?.(e);
      }}
    />
  );
};

export default JobImage;