const AppImage = ({
  src,
  alt,
  width,
  height,
  className = "",
  loading = "lazy",
  decoding = "async",
  ...props
}) => (
  <img
    src={src}
    alt={alt}
    width={width}
    height={height}
    loading={loading}
    decoding={decoding}
    className={className}
    {...props}
  />
);

export default AppImage;
