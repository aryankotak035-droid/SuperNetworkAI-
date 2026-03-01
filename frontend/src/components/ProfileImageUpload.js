import { useState, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProfileImageUpload = ({ currentImage, onImageChange }) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Allowed: JPEG, PNG, WebP, GIF");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size: 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${BACKEND_URL}/api/profile/image`,
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      onImageChange(response.data.image_url);
      toast.success("Profile image uploaded!");
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || "Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!currentImage) return;
    
    setDeleting(true);
    try {
      await axios.delete(`${BACKEND_URL}/api/profile/image`, {
        withCredentials: true
      });
      onImageChange(null);
      toast.success("Profile image removed");
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Failed to delete image");
    } finally {
      setDeleting(false);
    }
  };

  const imageUrl = currentImage ? `${BACKEND_URL}${currentImage}` : null;

  return (
    <div className="relative group" data-testid="profile-image-upload">
      {/* Profile Image Display */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="relative w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-secondary shadow-lg"
      >
        <AnimatePresence mode="wait">
          {imageUrl ? (
            <motion.img
              key="image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={imageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex items-center justify-center"
            >
              <Camera className="w-10 h-10 text-white/70" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {uploading || deleting ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white"
                onClick={() => fileInputRef.current?.click()}
                data-testid="upload-image-button"
              >
                <Camera className="w-5 h-5" />
              </Button>
              {currentImage && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 rounded-full bg-red-500/50 hover:bg-red-500/70 text-white"
                  onClick={handleDelete}
                  data-testid="delete-image-button"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload hint */}
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Click to {currentImage ? 'change' : 'upload'} photo
      </p>
    </div>
  );
};

export default ProfileImageUpload;
