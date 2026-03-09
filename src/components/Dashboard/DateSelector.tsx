'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function DateSelector({ initialDate }: { initialDate: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value;
        const params = new URLSearchParams(searchParams);

        if (date) {
            params.set('date', date);
        } else {
            params.delete('date');
        }

        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div
            className="flex items-center rounded-full px-5 py-2.5 w-fit shadow-lg shadow-emerald-900/20 cursor-pointer transition-colors"
            style={{ backgroundColor: '#059669', border: '1px solid rgba(52, 211, 153, 0.5)' }}
        >
            <div className="flex flex-col justify-center">
                <div className="relative">
                    <input
                        id="dashboard-date"
                        type="date"
                        value={initialDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={handleDateChange}
                        className="bg-transparent border-none font-medium text-sm focus:ring-0 focus:outline-none p-0 m-0 w-[160px] cursor-pointer"
                        style={{ color: '#ffffff', colorScheme: 'dark' }} // Attempt to force native dark calendar picker if browser supports it
                    />
                </div>
            </div>
        </div>
    );
}
