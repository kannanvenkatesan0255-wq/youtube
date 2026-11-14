/**
 * VidTube Video Upload Page
 * Phase 3 - Video Upload, Storage & Management Engine
 * Direct Cloudinary Signed Uploads with Real-Time Progress & Metadata Management
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Upload,
  Video as VideoIcon,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Globe,
  Link2,
  Lock,
  ArrowLeft,
  Tv,
  FileVideo,
  Zap,
  Music2
} from 'lucide-react';
import { videoService } from '../../services/videoService';
import { shortService } from '../../services/shortService';
import { CATEGORIES } from '../../utils/constants';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';

export const VideoUploadPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Mode: 'video' (long-form) vs 'short' (vertical 9:16 max 60s)
  const [uploadType, setUploadType] = useState(searchParams.get('type') === 'short' ? 'short' : 'video');

  // Step state: 'select' -> 'details' -> 'uploading' -> 'success'
  const [step, setStep] = useState('select');

  // File states
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState('');

  // Metadata states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [soundTitle, setSoundTitle] = useState('Original Audio');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(uploadType === 'short' ? ['Shorts', 'VidTube'] : ['VidTube', 'Coding']);
  const [visibility, setVisibility] = useState('public');
  const [language, setLanguage] = useState('English');
  const [location, setLocation] = useState('');

  // Upload Progress & Abort
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('Uploading video to Cloudinary...');
  const [createdItem, setCreatedItem] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCloudinaryConfigured, setIsCloudinaryConfigured] = useState(true);

  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
    };
  }, [videoPreviewUrl, thumbnailPreviewUrl]);

  // Handle Video File Selection
  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
      setErrorMessage('Please select a supported video format (MP4, WebM, MOV, or MKV).');
      return;
    }

    // Validate size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage('Video file exceeds maximum allowed limit of 100 MB.');
      return;
    }

    setErrorMessage('');
    setVideoFile(file);

    // Auto-populate Title from file name (clean extensions)
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setTitle(cleanTitle.slice(0, 100));

    // Create browser preview URL
    const objectUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(objectUrl);

    setStep('details');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file for the thumbnail (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Thumbnail file exceeds maximum limit of 5 MB.');
      return;
    }

    setThumbnailFile(file);
    const thumbUrl = URL.createObjectURL(file);
    setThumbnailPreviewUrl(thumbUrl);
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = tagInput.trim().replace(/^#/, '');
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Execute Upload Workflow
  const handleStartUpload = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage(`${uploadType === 'short' ? 'Short' : 'Video'} title is required.`);
      return;
    }

    if (!videoFile) {
      setErrorMessage('Please select a video file to upload.');
      return;
    }

    if (uploadType === 'short' && videoDuration > 60) {
      setErrorMessage(`VidTube Shorts must not exceed 60 seconds (current duration: ${videoDuration}s). Please trim your video or upload as a standard video.`);
      return;
    }

    setStep('uploading');
    setUploadProgress(10);
    setUploadStatusText('Authorizing secure cloud upload...');

    try {
      abortControllerRef.current = new AbortController();

      if (uploadType === 'short') {
        // --- SHORTS UPLOAD WORKFLOW ---
        const sigRes = await shortService.getUploadSignature();
        const signatureData = sigRes.data;

        let videoUrl = '';
        let publicId = '';
        let uploadedDuration = videoDuration || 30;
        let width = 720;
        let height = 1280;
        let format = 'mp4';
        let fileSize = videoFile.size;

        if (signatureData.isConfigured) {
          setIsCloudinaryConfigured(true);
          setUploadStatusText('Uploading vertical Short to Cloudinary storage...');

          const uploadResult = await shortService.uploadDirectToCloudinary(
            videoFile,
            signatureData,
            (percent) => {
              setUploadProgress(Math.max(15, Math.min(85, percent)));
            },
            abortControllerRef.current.signal
          );

          videoUrl = uploadResult.secure_url;
          publicId = uploadResult.public_id;
          uploadedDuration = Math.round(uploadResult.duration || videoDuration || 20);
          width = uploadResult.width || 720;
          height = uploadResult.height || 1280;
          format = uploadResult.format || 'mp4';
          fileSize = uploadResult.bytes || videoFile.size;
        } else {
          setIsCloudinaryConfigured(false);
          setUploadProgress(70);
          setUploadStatusText('Development mode: storing local short metadata...');
          videoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-skateboarding-tricks-in-a-skatepark-42247-large.mp4';
          publicId = `local_short_${Date.now()}`;
        }

        setUploadProgress(90);
        setUploadStatusText('Saving Short details to VidTube database...');

        // Create short record draft
        const createRes = await shortService.createShort({
          title,
          description,
          tags,
          visibility,
          soundTitle: soundTitle || 'Original Audio',
          videoUrl,
          publicId,
          thumbnailUrl: thumbnailPreviewUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
          duration: uploadedDuration,
          width,
          height,
          aspectRatio: '9:16',
          format,
          fileSize
        });

        const shortId = createRes.data.id || createRes.data._id;

        // Complete upload
        const completeRes = await shortService.completeUpload(shortId, {
          videoUrl,
          publicId,
          thumbnailUrl: thumbnailPreviewUrl || createRes.data.thumbnailUrl,
          duration: uploadedDuration,
          width,
          height,
          format,
          fileSize,
          processingStatus: 'ready'
        });

        setUploadProgress(100);
        setCreatedItem(completeRes.data);
        setStep('success');
      } else {
        // --- STANDARD LONG-FORM VIDEO WORKFLOW ---
        const sigRes = await videoService.getUploadSignature({
          resourceType: 'video',
          folder: 'vidtube/videos'
        });

        const signatureData = sigRes.data;

        let videoUrl = '';
        let publicId = '';
        let uploadedDuration = videoDuration || 45;
        let width = 1280;
        let height = 720;
        let format = 'mp4';
        let fileSize = videoFile.size;

        if (signatureData.isConfigured) {
          setIsCloudinaryConfigured(true);
          setUploadStatusText('Uploading video to Cloudinary storage...');

          const uploadResult = await videoService.uploadDirectToCloudinary(
            videoFile,
            signatureData,
            (percent) => {
              setUploadProgress(Math.max(15, Math.min(85, percent)));
            },
            abortControllerRef.current.signal
          );

          videoUrl = uploadResult.secure_url;
          publicId = uploadResult.public_id;
          uploadedDuration = Math.round(uploadResult.duration || videoDuration || 30);
          width = uploadResult.width || 1280;
          height = uploadResult.height || 720;
          format = uploadResult.format || 'mp4';
          fileSize = uploadResult.bytes || videoFile.size;
        } else {
          setIsCloudinaryConfigured(false);
          setUploadProgress(70);
          setUploadStatusText('Cloudinary credentials not configured. Saving local metadata and mock stream URL...');

          videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
          publicId = `local_sample_${Date.now()}`;
        }

        setUploadProgress(90);
        setUploadStatusText('Saving video details to VidTube database...');

        const createRes = await videoService.createVideo({
          title,
          description,
          category,
          tags,
          visibility,
          language,
          location,
          videoUrl,
          publicId,
          thumbnailUrl: thumbnailPreviewUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
          duration: uploadedDuration,
          width,
          height,
          format,
          fileSize,
          resolution: height >= 1080 ? '1080p' : '720p'
        });

        setUploadProgress(100);
        setCreatedItem(createRes.data);
        setStep('success');
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'canceled') {
        setUploadStatusText('Upload canceled.');
        setStep('details');
      } else {
        setErrorMessage(err.message || 'Upload failed. Please try again.');
        setStep('details');
      }
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStep('details');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <Link
            to="/studio/videos"
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
              Upload video
            </h1>
            <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">
              Post a video to your channel ({user?.channel?.handle || `@${user?.username}`})
            </p>
          </div>
        </div>

        <Link to="/studio/videos">
          <Button variant="outline" size="sm">
            View channel videos
          </Button>
        </Link>
      </div>

      {/* Upload Type Selector (Tabs: Video vs Short) */}
      <div className="flex items-center gap-2 mb-6 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => {
            setUploadType('video');
            setTags(['VidTube', 'Coding']);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            uploadType === 'video'
              ? 'bg-white dark:bg-[#0f0f0f] text-[#0f0f0f] dark:text-[#f1f1f1] shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <VideoIcon className="w-4 h-4 text-red-600" />
          Long-form Video
        </button>

        <button
          type="button"
          onClick={() => {
            setUploadType('short');
            setTags(['Shorts', 'VidTube']);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            uploadType === 'short'
              ? 'bg-white dark:bg-[#0f0f0f] text-[#0f0f0f] dark:text-[#f1f1f1] shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          VidTube Short (Vertical 9:16)
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Upload Error</span>
            <span className="text-xs">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 1: DROPZONE / SELECT FILE */}
      {step === 'select' && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl p-10 sm:p-16 flex flex-col items-center justify-center text-center transition-colors bg-neutral-50/50 dark:bg-[#1f1f1f]/30 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />

          <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 mb-6 group-hover:scale-110 transition-transform">
            <Upload className="w-9 h-9" />
          </div>

          <h2 className="text-lg font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] mb-2">
            {uploadType === 'short'
              ? 'Drag and drop vertical video for your Short'
              : 'Drag and drop video files to upload'}
          </h2>
          <p className="text-xs text-[#606060] dark:text-[#aaaaaa] max-w-sm mb-6">
            {uploadType === 'short'
              ? 'Shorts must be 60 seconds or shorter in vertical 9:16 orientation. Supports MP4, WebM, MOV up to 50 MB.'
              : 'Your videos will be private until you publish them. Supports MP4, WebM, MOV, and MKV up to 100 MB.'}
          </p>

          <Button
            type="button"
            variant="primary"
            size="md"
            className="rounded-full px-6 font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            {uploadType === 'short' ? 'Select Short video' : 'Select video file'}
          </Button>
        </div>
      )}

      {/* STEP 2: VIDEO DETAILS & PREVIEW */}
      {step === 'details' && (
        <form onSubmit={handleStartUpload} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Fields */}
            <div className="lg:col-span-2 space-y-5">
              {/* Title Input */}
              <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Title (required)
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    {title.length}/100
                  </span>
                </div>
                <input
                  type="text"
                  value={title}
                  maxLength={100}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={uploadType === 'short' ? 'Add a title for your Short (e.g. Crazy trick! #shorts)' : 'Add a title that describes your video'}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Sound Attribution Input (Shorts only) */}
              {uploadType === 'short' && (
                <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Music2 className="w-3.5 h-3.5 text-neutral-500" /> Sound attribution / audio title
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      {soundTitle.length}/100
                    </span>
                  </div>
                  <input
                    type="text"
                    value={soundTitle}
                    maxLength={100}
                    onChange={(e) => setSoundTitle(e.target.value)}
                    placeholder="Original Audio - Your Name"
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}

              {/* Description Input */}
              <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Description
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    {description.length}/5000
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={description}
                  maxLength={5000}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers about your video (links, topics, timestamps)"
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600 resize-y"
                />
              </div>

              {/* Thumbnail Selector */}
              <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Thumbnail
                </label>
                <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mb-3">
                  Set a thumbnail that stands out and draws viewers' attention.
                </p>

                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleThumbnailSelect}
                />

                <div className="flex flex-wrap items-center gap-4">
                  {thumbnailPreviewUrl ? (
                    <div className="relative aspect-video w-36 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                      <img src={thumbnailPreviewUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setThumbnailPreviewUrl('')}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : null}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => thumbnailInputRef.current?.click()}
                    icon={<ImageIcon className="w-4 h-4" />}
                  >
                    {thumbnailPreviewUrl ? 'Change thumbnail' : 'Upload custom thumbnail'}
                  </Button>
                </div>
              </div>

              {/* Category & Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Video Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Japanese">Japanese</option>
                  </select>
                </div>
              </div>

              {/* Tags Input */}
              <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Tags
                </label>
                <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mb-2">
                  Tags help viewers find your video if they misspell keywords. Press Enter or comma to add.
                </p>

                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add a tag..."
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Visibility Options */}
              <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Visibility
                </label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={visibility === 'public'}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-[#0f0f0f] dark:text-[#f1f1f1]">
                        <Globe className="w-4 h-4 text-emerald-600" /> Public
                      </div>
                      <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-0.5">
                        Everyone can watch your video. It will appear in search results and subscriber feeds.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <input
                      type="radio"
                      name="visibility"
                      value="unlisted"
                      checked={visibility === 'unlisted'}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-[#0f0f0f] dark:text-[#f1f1f1]">
                        <Link2 className="w-4 h-4 text-blue-600" /> Unlisted
                      </div>
                      <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-0.5">
                        Anyone with the video link can watch. Excluded from public discovery feeds.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={visibility === 'private'}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-[#0f0f0f] dark:text-[#f1f1f1]">
                        <Lock className="w-4 h-4 text-amber-600" /> Private
                      </div>
                      <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-0.5">
                        Only you and people you choose can watch your video.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Col: Video Preview Card */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sticky top-20">
                <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-3">
                  Preview
                </h3>

                {videoPreviewUrl ? (
                  <div
                    className={`${
                      uploadType === 'short'
                        ? 'aspect-[9/16] max-w-[200px] mx-auto'
                        : 'aspect-video w-full'
                    } rounded-xl overflow-hidden bg-black mb-3`}
                  >
                    <video
                      src={videoPreviewUrl}
                      controls
                      onLoadedMetadata={(e) => setVideoDuration(Math.round(e.target.duration))}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className={`${
                      uploadType === 'short'
                        ? 'aspect-[9/16] max-w-[200px] mx-auto'
                        : 'aspect-video w-full'
                    } rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3`}
                  >
                    <FileVideo className="w-8 h-8" />
                  </div>
                )}

                <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5">
                  <div className="flex justify-between">
                    <span>File name:</span>
                    <span className="font-medium text-[#0f0f0f] dark:text-[#f1f1f1] truncate max-w-36">
                      {videoFile?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>File size:</span>
                    <span className="font-medium text-[#0f0f0f] dark:text-[#f1f1f1]">
                      {(videoFile?.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  {videoDuration > 0 && (
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span
                        className={`font-semibold ${
                          uploadType === 'short' && videoDuration > 60
                            ? 'text-red-500 font-bold'
                            : 'text-[#0f0f0f] dark:text-[#f1f1f1]'
                        }`}
                      >
                        {videoDuration}s {uploadType === 'short' && videoDuration > 60 ? '⚠️ (Exceeds 60s limit)' : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Visibility:</span>
                    <span className="font-semibold capitalize text-[#0f0f0f] dark:text-[#f1f1f1]">
                      {visibility}
                    </span>
                  </div>
                </div>

                {uploadType === 'short' && videoDuration > 60 && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-[11px] leading-tight">
                    Shorts cannot exceed 60 seconds. Please select a shorter video or switch tabs to Long-form Video.
                  </div>
                )}

                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-4 space-y-2">
                  <Button
                    type="submit"
                    variant="accent"
                    size="md"
                    className="w-full justify-center py-2.5 font-semibold"
                  >
                    Save & Publish {uploadType === 'short' ? 'Short' : 'Video'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => setStep('select')}
                  >
                    Change video file
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* STEP 3: UPLOADING PROGRESS */}
      {step === 'uploading' && (
        <div className="max-w-lg mx-auto bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
            <Upload className="w-8 h-8 animate-bounce" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
              Publishing {uploadType === 'short' ? 'Short' : 'Video'}: "{title}"
            </h2>
            <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-1">
              {uploadStatusText}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF0033] transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-500 font-semibold">
              <span>Progress</span>
              <span>{uploadProgress}%</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelUpload}
            >
              Cancel upload
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS */}
      {step === 'success' && createdItem && (
        <div className="max-w-lg mx-auto bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
              {uploadType === 'short' ? 'Short' : 'Video'} successfully published!
            </h2>
            <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-1">
              Your {uploadType === 'short' ? 'Short' : 'video'} is now available in {createdItem.visibility} mode.
            </p>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-left flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
            <span className="truncate pr-2 font-mono">
              {uploadType === 'short'
                ? `/shorts/${createdItem.id || createdItem._id}`
                : `/watch/${createdItem.id || createdItem._id}`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const url = uploadType === 'short'
                  ? `${window.location.origin}/shorts/${createdItem.id || createdItem._id}`
                  : `${window.location.origin}/watch/${createdItem.id || createdItem._id}`;
                navigator.clipboard.writeText(url);
                alert('Link copied to clipboard!');
              }}
            >
              Copy link
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to={uploadType === 'short' ? `/shorts/${createdItem.id || createdItem._id}` : `/watch/${createdItem.id || createdItem._id}`}
              className="flex-1"
            >
              <Button variant="primary" size="md" className="w-full justify-center">
                {uploadType === 'short' ? 'Watch Short' : 'Watch Video'}
              </Button>
            </Link>
            <Link to={uploadType === 'short' ? '/studio/videos?tab=shorts' : '/studio/videos'} className="flex-1">
              <Button variant="outline" size="md" className="w-full justify-center">
                Manage in Studio
              </Button>
            </Link>
          </div>

          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-500"
              onClick={() => {
                setVideoFile(null);
                setVideoPreviewUrl('');
                setTitle('');
                setDescription('');
                setCreatedItem(null);
                setStep('select');
              }}
            >
              Upload another {uploadType === 'short' ? 'Short' : 'video'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploadPage;
