export default function Input({ ...props }) {
  return (
    <input
      {...props}
      className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}