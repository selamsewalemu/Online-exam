const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizes = { sm: 'h-5 w-5', md: 'h-10 w-10', lg: 'h-16 w-16' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizes[size]}`} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
