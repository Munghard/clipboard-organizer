import { useState } from "react";

const ThemeSelector = () => {
    const [showPalette, setShowPalette] = useState(false);

    const setTheme = (theme) => {
        console.log("Color set to", theme);

        document.documentElement.classList.toggle(theme);
    }

    return (
        <>
            <button onClick={() => setShowPalette(!showPalette)} className="button button-secondary bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 "><i className="fa fa-palette"></i> Theme</button>
            {showPalette &&
                <div className="flex p-2 gap-2">
                    <>
                        <button onClick={() => setTheme("dark")} className={`button bg-zinc-900 border-2 border-zinc-500`}> </button>
                        <button onClick={() => setTheme("light")} className={`button bg-zinc-100 border-2 border-zinc-500`}> </button>
                    </>
                </div>
            }
        </>
    )

}
export default ThemeSelector;