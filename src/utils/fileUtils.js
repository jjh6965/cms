const fileUtils = {
  // 상수 정의 (환경 변수에서 가져오거나 디폴트값 사용)
  _MAX_FILES: parseInt(import.meta.env.VITE_MAX_FILES, 10) || 5,
  _MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE, 10) || 50 * 1024 * 1024, // 50MB
  _ACCEPT: '*', // Default to all files

  // MAX_FILES getter/setter
  getMaxFiles() {
    return this._MAX_FILES;
  },
  setMaxFiles(value) {
    if (typeof value === 'number' && value > 0) {
      this._MAX_FILES = value;
    } else {
      console.warn('MAX_FILES는 양수 숫자여야 합니다.');
    }
  },

  // MAX_FILE_SIZE getter/setter
  getMaxFileSize() {
    return this._MAX_FILE_SIZE;
  },
  setMaxFileSize(value) {
    if (typeof value === 'number' && value > 0) {
      this._MAX_FILE_SIZE = value;
    } else {
      console.warn('MAX_FILE_SIZE는 양수 숫자여야 합니다.');
    }
  },

  // ACCEPT getter/setter
  getAccept() {
    // Normalize accept values for browser compatibility
    if (this._ACCEPT === 'text/*') {
      return 'text/plain';
    }
    if (this._ACCEPT === 'document/*') {
      return this.documentExtensions
        .map(ext => this.mimeTypes[ext])
        .filter(mime => mime)
        .join(',');
    }
    return this._ACCEPT;
  },
  setAccept(value) {
    if (typeof value === 'string' && value.trim()) {
      const normalizedValue = value.trim().toLowerCase();
      // Map common wildcards to supported MIME types
      if (normalizedValue === 'image/*') {
        this._ACCEPT = this.imageExtensions
          .map(ext => this.mimeTypes[ext])
          .filter(mime => mime)
          .join(',');
      } else if (normalizedValue === 'video/*') {
        this._ACCEPT = this.videoExtensions
          .map(ext => this.mimeTypes[ext])
          .filter(mime => mime)
          .join(',');
      } else if (normalizedValue === 'audio/*') {
        this._ACCEPT = this.audioExtensions
          .map(ext => this.mimeTypes[ext])
          .filter(mime => mime)
          .join(',');
      } else if (normalizedValue === 'text/*') {
        this._ACCEPT = this.textExtensions
          .map(ext => this.mimeTypes[ext])
          .filter(mime => mime)
          .join(',');
      } else if (normalizedValue === 'document/*') {
        this._ACCEPT = 'document/*'; // Store as document/*, normalize in getAccept
      } else if (normalizedValue === '*' || normalizedValue === '*/*') {
        this._ACCEPT = '*';
      } else {
        this._ACCEPT = normalizedValue;
      }
    } else if (Array.isArray(value) && value.length > 0) {
      // Convert array of extensions to MIME types
      const mimeTypes = value
        .map(ext => this.mimeTypes[ext.toLowerCase()])
        .filter(mime => mime)
        .join(',');
      this._ACCEPT = mimeTypes || '*';
    } else {
      console.warn('ACCEPT는 유효한 문자열 또는 확장자 배열이어야 합니다.');
      this._ACCEPT = '*';
    }
  },

  // Validate file against current accept setting
  isValidFile(file) {
    const extension = this.getFileExtension(file.fileName || file.name);
    const mimeType = this.mimeTypes[extension];

    if (this._ACCEPT === '*') {
      return true;
    }

    // Check if file matches the accept MIME types
    const acceptTypes = this._ACCEPT.split(',').map(type => type.trim());
    if (acceptTypes.includes(mimeType)) {
      return true;
    }

    // Handle wildcard cases
    if (this._ACCEPT === 'document/*' && this.isDocumentFile(file)) {
      return true;
    }
    if (acceptTypes.some(type => type === 'image/*' && this.isImageFile(file))) {
      return true;
    }
    if (acceptTypes.some(type => type === 'video/*' && this.isVideoFile(file))) {
      return true;
    }
    if (acceptTypes.some(type => type === 'audio/*' && this.isAudioFile(file))) {
      return true;
    }
    if (acceptTypes.some(type => type === 'text/plain' && this.isTextFile(file))) {
      return true;
    }

    return false;
  },

  // MIME 타입 매핑
  mimeTypes: {
    // 이미지 파일
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    webp: 'image/webp',
    // ZIP 및 압축 파일
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    // 동영상 파일
    mp4: 'video/mp4',
    mpeg: 'video/mpeg',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
    webm: 'video/webm',
    // 오디오 파일
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    aac: 'audio/aac',
    flac: 'audio/flac',
    // 문서 파일
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    log: 'text/plain',
  },

  // 파일 확장자 리스트
  imageExtensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp'],
  zipExtensions: ['zip', 'rar', '7z', 'tar', 'gz'],
  videoExtensions: ['mp4', 'mpeg', 'mov', 'avi', 'wmv', 'flv', 'webm'],
  audioExtensions: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
  textExtensions: ['txt', 'log'],
  documentExtensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],

  // 파일 크기 포맷팅 (KB, MB 등으로 변환)
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // 파일 확장자 추출
  getFileExtension(fileName) {
    return fileName.split('.').pop().toLowerCase();
  },

  // 이미지 파일 여부 체크
  isImageFile(file) {
    const extension = this.getFileExtension(file.fileName || file.name);
    return this.imageExtensions.includes(extension);
  },

  // ZIP 파일 여부 체크
  isZipFile(file) {
    const extension = this.getFileExtension(file.fileName || file.name);
    return this.zipExtensions.includes(extension);
  },

  // 동영상 파일 여부 체크
  isVideoFile(file) {
    const extension = this.getFileExtension(file.fileName || file.name);
    return this.videoExtensions.includes(extension);
  },

  // 오디오 파일 여부 체크
  isAudioFile(file) {
    const extension = this.getFileExtension(file.fileName || file.name);
    return this.audioExtensions.includes(extension);
  },

  // 텍스트 파일 여부 체크
  isTextFile(file) {
    const extension = this.getFileExtension(file.fileName || file.name);
    return this.textExtensions.includes(extension);
  },

  // 문서 파일 여부 체크
  isDocumentFile(file) {
    const extension = this.getFileExtension(file.fileName || file.name);
    return this.documentExtensions.includes(extension);
  },

  // 파일 타입에 따른 Bootstrap 아이콘 반환
  getFileIcon(file) {
    const extension = this.getFileExtension(file.fileName || file.name);
    if (this.imageExtensions.includes(extension)) {
      return 'bi-image';
    } else if (this.zipExtensions.includes(extension)) {
      return 'bi-file-earmark-zip';
    } else if (this.videoExtensions.includes(extension)) {
      return 'bi-camera-video';
    } else if (this.audioExtensions.includes(extension)) {
      return 'bi-music-note';
    } else if (extension === 'pdf') {
      return 'bi-file-earmark-pdf';
    } else if (['doc', 'docx'].includes(extension)) {
      return 'bi-file-earmark-word';
    } else if (['xls', 'xlsx'].includes(extension)) {
      return 'bi-file-earmark-excel';
    } else if (['ppt', 'pptx'].includes(extension)) {
      return 'bi-file-earmark-slides';
    } else if (this.textExtensions.includes(extension)) {
      return 'bi-file-earmark-text';
    } else {
      return 'bi-file-earmark';
    }
  },

  // Base64 문자열을 UTF-8 텍스트로 디코딩
  decodeBase64ToText(base64String) {
    try {
      const decodedData = atob(base64String);
      return decodeURIComponent(escape(decodedData));
    } catch (error) {
      console.error('Error decoding base64 to text:', error);
      throw new Error('텍스트 파일을 디코딩하는 중 오류가 발생했습니다.');
    }
  },

  // UTF-8 텍스트를 Base64 문자열로 인코딩
  encodeTextToBase64(text) {
    try {
      const encodedData = unescape(encodeURIComponent(text));
      return btoa(encodedData);
    } catch (error) {
      console.error('Error encoding text to base64:', error);
      throw new Error('텍스트를 Base64로 인코딩하는 중 오류가 발생했습니다.');
    }
  },
};

export default fileUtils;