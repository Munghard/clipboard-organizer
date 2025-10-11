import { useState } from 'react'
import './App.css'
import Entry from './Entry'
import {AnimatePresence, motion} from 'framer-motion';
import './output.css';
import './index.css';



function App() {
	const [name, setName] = useState('Note')
	const [data, setData] = useState('Details')
	const [prio, setPrio] = useState(1)
	const [date, setDate] = useState(() => { return new Date().toISOString().split("T")[0]; })
	const [img, setImg] = useState('')
	const [folder, setFolder] = useState('')
	const [showNewNote, setShowNewNote] = useState(false)
	const [showFolders, setShowFolders] = useState(false)
	const [showNotes, setShowNotes] = useState(true)
	const [showButtons, setShowButtons] = useState(true)
	const [activeFolder, setActiveFolder] = useState('')



	const getFolders = () => {
		const data = JSON.parse(localStorage.getItem("entry_folder") || "[]");
		return Array.isArray(data) ? data : [data];
	};
	const getOrder = () => JSON.parse(localStorage.getItem("entry_order") || "[]");
	const setOrder = (order) => localStorage.setItem("entry_order", JSON.stringify(order));

	const Save = () => {
		const id = 'entry_' + Date.now();
		const entry = { name, data, date, img, prio, folder };
		localStorage.setItem(id, JSON.stringify(entry));

		const order = getOrder();
		order.push(id);       // push the new entry id
		setOrder(order);

		window.location.reload();
	}
	const deleteFolder = (folderName) => {
		let existing = JSON.parse(localStorage.getItem("entry_folder") || "[]");

		if (!Array.isArray(existing)) existing = [existing];

		// remove the folder
		existing = existing.filter((f) => f !== folderName);
		localStorage.setItem("entry_folder", JSON.stringify(existing));

		// also clear the folder field from entries that had it

		const order = getOrder();
		order.forEach((id) => {
			const entry = JSON.parse(localStorage.getItem(id) || "{}");
			if (entry.folder === folderName) {
				entry.folder = ""; // move to "All"
				localStorage.setItem(id, JSON.stringify(entry));
			}
		});

		window.location.reload();
	};


	const DeleteEntry = (id) => {
		// remove the entry from storage
		localStorage.removeItem(id);

		// remove the id from the order array
		let order = getOrder();
		order = order.filter((entryId) => entryId !== id);
		setOrder(order);

		window.location.reload();
	}

	const ClearData = () => {
		if(confirm('Are you sure? This will clear all local data!'))
		{
			localStorage.clear();
			window.location.reload();
		}

	}
	const order = (dir, id) => {
		let order = getOrder();
		let idx = order.indexOf(id);
		if (idx === -1) return;

		if (dir === "up" && idx > 0) {
			[order[idx - 1], order[idx]] = [order[idx], order[idx - 1]];
		} else if (dir === "down" && idx < order.length - 1) {
			[order[idx + 1], order[idx]] = [order[idx], order[idx + 1]];
		}

		setOrder(order);
		window.location.reload();
	};

	const HandleNewFolder = () => {
		let existing = JSON.parse(localStorage.getItem("entry_folder") || "[]");

		// Jos se ei ole array, muutetaan arrayksi
		if (!Array.isArray(existing)) {
			existing = [existing];
		}

		existing.push(folder);

		localStorage.setItem("entry_folder", JSON.stringify(existing));
		window.location.reload();
	};

	const getItemsInFolder = (folderName) => {
		return getOrder().filter((id) => {
		  try {
			const entry = JSON.parse(localStorage.getItem(id) || "{}");
			return entry.folder === folderName || folderName === '';
		  } catch {
			return false;
		  }
		}).length;
	  };
	  



	return (
		<>
		<div>
			<h1 className='text-7xl text-gray-500'>Notes</h1>
		</div>
			<motion.div 
			initial={{opacity:0}}
			 animate={{opacity:1}}
			  layout transition={{ layout: { duration: 1, type: "spring" } }}
			   className='flex-column gap-2' style={{ width: '500px' }}>
				{showButtons &&
				<div className="flex flex-col gap-2 justify-start items-start mb-2">

					<button className='bg-blue-600 p-2 rounded  ' onClick={() => ClearData()}>Clear local data <i className="fa fa-trash"></i></button>

					<button className={` p-2 rounded  ${showFolders? "bg-green-600 ": "bg-blue-600"}` }onClick={() => setShowFolders(!showFolders)}>Folders <i className="fa fa-folder"></i></button>
					{showFolders &&
						<div className='Card' id='folders'>
							<h3>Folders</h3>
							<div className='d-flex flex-row w-auto gap-2'>
								<input className='w-100' type='text' placeholder='Folder name' id='folder' value={folder} onChange={(e) => setFolder(e.target.value)} />
								<button className='btn btn-success ' onClick={() => {
									HandleNewFolder();
								}}><i className="fa fa-circle-plus"></i></button>
							</div>
							<div className='d-flex flex-column gap-1'>
								<div  className='d-flex flex-row w-auto gap-2'>
									<p className='mt-auto mb-auto'> {getItemsInFolder('')}</p>
									<i className='fa fa-hashtag mt-auto mb-auto'></i>
									<button className='w-100'  onClick={() => setActiveFolder('')}>All</button>
								</div>
								{getFolders().map((i) => (
									<div key={i} className='d-flex flex-row w-auto gap-2'>
										<p className='mt-auto mb-auto'> {getItemsInFolder(i)} </p>
										<i className='fa fa-hashtag mt-auto mb-auto'></i>
										<button className='w-100' onClick={() => setActiveFolder(i)}>{i}</button>
										<button onClick={() => deleteFolder((i))}><i className='fa fa-trash'></i></button>

									</div>
								))}
							</div>
						</div>
					}
					<button className={` p-2 rounded  ${showNewNote? "bg-green-600 ": "bg-blue-600"}` } onClick={() => setShowNewNote(!showNewNote)}>New note <i className="fa fa-pen"></i></button>
					{showNewNote &&
						<div className='Card' >
							<h1 className='text mb-4'>New Note</h1>
							<div className='d-flex flex-column gap-2'>
								<input type='text' placeholder='Name' value={name} onChange={(e) => setName(e.target.value)} />
								<textarea type='text' placeholder='Data' value={data} onChange={(e) => setData(e.target.value)} />
								<input type='date' placeholder='Date' value={date} onChange={(e) => setDate(e.target.value)} />
								<select value={folder} onChange={(e) => setFolder(e.target.value)}>
									<option value="">-Folder-</option>
									{getFolders().map((f) => (
										<option key={f} value={f}>
											{f}
										</option>
									))}
								</select>

								<input type='number' placeholder='priority' value={prio} onChange={(e) => setPrio(e.target.value)} max={10} />
								<div className='d-flex flex-row gap-1' id="prio">

									{Array.from({ length: prio }, (_, i) => (
										<span key={i} role="img" aria-label="prio">⭐</span>
									))}
								</div>
								<input
									type="file"
									accept="image/*"
									onChange={(e) => {
										const file = e.target.files[0];
										if (file) {
											const url = URL.createObjectURL(file);
											setImg(url);
										}
									}}
								/>
								{img && <img src={img} alt="preview" style={{ maxWidth: "200px" }} />}

								<button className='btn btn-success' onClick={() => Save()}>Save</button>
							</div>

						</div>
					}
					<button className={` p-2 rounded  ${showNotes? "bg-green-600 ": "bg-blue-600"}` } onClick={() => setShowNotes(!showNotes)}>Show Notes <i className="fa fa-note-sticky"></i></button>
				</div>

				}
				<button className={` p-2 rounded mb-2  ${showButtons? "bg-green-600 ": "bg-blue-600"}` } onClick={() => setShowButtons(!showButtons)}>Actions <i className="fa fa-bars"></i></button>
				{/* Entries container */}

				{showNotes && (
					<div
					layout transition={{ layout: { duration: 1, type: "spring" } }}
					initial={{ y: -200, scaleY: 0, opacity: 0 }}
					animate={{ y: 0, scaleY: 1, opacity: 1 }}
					 className="Container p-2 d-flex flex-wrap flex-column gap-2  border-gray-800 border-2">
						<div className='d-flex items-end'>
							<p className='text-4xl text-gray-600'>Folder:</p>
							<h1 className="p-2 text-blue-600 text-2xl font-bold"> {activeFolder || "All"}</h1>
						</div>
						{/* Render saved entries */}
						{(() => {
							const items = getOrder()
								.map((id) => {
									try {
										const entry = JSON.parse(localStorage.getItem(id) || "{}");
										return { id, entry };
									} catch {
										return null;
									}
								})
								.filter((item) => {
									if (!item) return false;
									if (activeFolder) {
										return item.entry.folder === activeFolder;
									}
									return true; // show all
								});


							if (items.length === 0) {
								return <p>No notes in folder.</p>;
							}

							return items.map(({ id, entry }) => (

								<Entry
									key={id}
									DeleteEntry={DeleteEntry}
									id={id}
									order={order}
									name={entry.name}
									data={entry.data}
									date={entry.date}
									img={entry.img}
									priority={entry.prio}
									folder={entry.folder || "Uncategorized"}
								/>
							));

						})()}
					</div>
				)}
			</motion.div>
		</>
	);
}

export default App
