import {motion} from "framer-motion";
import { useState } from "react";


const Entry = ({ order, DeleteEntry, id, priority, name, data, date, folder, img }) => {

    const [showDetails, setShowdetails] = useState(false)


    return (
        <motion.div className="Card border-gray-800 border-2" onHoverEnd={() => setShowdetails(false)} onHoverStart={(e) => setShowdetails(e)}
        layout transition={{ layout: { duration: 0.3, type: "spring" } }}
        initial={{y: -200,scaleY:0 ,opacity: 0}}
        animate={{y:0, scaleY:1,opacity: 1}}
        duration={{duration:1,type:'spring'}}
         >
            <div className="float-end">
                
                <button className="btn btn-sm close" onClick={() => DeleteEntry(id)}><i className="fa fa-trash"></i></button>
                <div className="d-flex flex-column gap-1">
                    <button className="btn btn-sm arrow" onClick={() => order("up", id)}>▲</button>
                    <button className="btn btn-sm arrow" onClick={() => order("down", id)}>▼</button>
                </div>
            </div>
            <h1 className="text-4xl text-gray-200">{name}</h1>
            <p className="text-gray-400 ">{data}</p>
            {showDetails &&
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.3}}>
                {img && <img src={img} alt="preview" style={{ maxWidth: "200px", "borderRadius": "4px" }} />}
                <div id="prio" className="muted d-flex flex-row gap-1">
                    {Array.from({ length: priority }, (_, i) => (
                        <span key={i} role="img" aria-label="star">⭐</span>
                    ))}
                    
                    </div>
                    <div className="d-flex justify-content-between align-items-center m-0">
                        <p className="text-xl text-gray-400">{folder}</p>
                        <p className='text-gray-500 m-0 text-right'>{date}</p>
                    </div>
                </motion.div>
            }
        </motion.div>

    )

}
export default Entry;