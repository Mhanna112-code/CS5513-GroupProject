import { HTMLProps } from "react";

type TextInputProps = HTMLProps<HTMLInputElement> & {
  label?: string;
  isFormik?: boolean;
};

export function TextInput({
  label,
  required = false,
  isFormik = false,
  ...props
}: TextInputProps) {
  return (
    <div className="flex flex-col">
      {label ? (
        <label htmlFor={props.id}>
          {label}
          {required ? <span className="text-red-600">*</span> : null}
        </label>
      ) : null}
      <input
        className="w-full h-7 rounded-sm px-2 py-4 text-slate-800"
        {...props}
      />
    </div>
  );
}
