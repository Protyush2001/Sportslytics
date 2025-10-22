

const EnhancedVideoPlayer = ({ videoUrl, title, description }) => {
  if (!videoUrl) return null;

  return (
    <div className="my-8 p-6 bg-white shadow-lg rounded-2xl border border-gray-100">
      <h3 className="text-xl font-semibold mb-3">{title || "Match Recording"}</h3>

      <video
        controls
        playsInline
        className="w-full rounded-lg shadow-md"
        style={{ maxHeight: "480px" }}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {description && (
        <p className="text-gray-600 text-sm mt-2 italic">{description}</p>
      )}
    </div>
  );
};

export default EnhancedVideoPlayer;
