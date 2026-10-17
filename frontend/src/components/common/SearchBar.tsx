import { Search, X } from "lucide-react";

interface SearchBarProps {
    search: string;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    text?:string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    search,
    setSearch,
    text,
}) => {
    return (
        <div className="relative w-full md:max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Search size={18} />
            </div>
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={text}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            {search ? (
                <button
                    onClick={() => setSearch("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 cursor-pointer"
                >
                    <X size={18} />
                </button>
            ) : null}
        </div>
    );
};
