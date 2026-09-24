import { Input } from "@/components/ui/input";

type SearchBarProps = {
  name?: string;
  placeholder?: string;
  defaultValue?: string;
};

export function SearchBar({
  name = "q",
  placeholder = "Search",
  defaultValue,
}: SearchBarProps) {
  return (
    <Input
      type="search"
      name={name}
      placeholder={placeholder}
      defaultValue={defaultValue}
    />
  );
}
