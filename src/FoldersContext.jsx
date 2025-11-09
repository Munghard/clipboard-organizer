import { createContext, useState, useContext, useEffect } from "react";
import { UserContext } from "./UserContext";
import { supabase } from "./supabaseClient";
import { useClipboard } from "./ClipBoardContext";

export const FoldersContext = createContext();

export function FoldersProvider({ children }) {

    // FOLDERS
    const [folders, setFolders] = useState([]);
    const [activeFolder, setActiveFolder] = useState('');
    const [editFolder, setEditFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [showFolders, setShowFolders] = useState(false);
    const [openEditFolder, setOpenEditFolder] = useState(false);
    const [editableFolder, setEditableFolder] = useState(null);

    const {userId} = useContext(UserContext);
    const { entries, setEntries } = useClipboard();

    
    // Add a new folder
    const addFolder = async (name) => {
        if (!name || folders.some(f => f.name === name)) return;

        const newFolder = { name, user_id: userId };

        const { data, error } = await supabase
            .from('folders')
            .insert([newFolder]) // insert expects an array
            .select();           // select to get the inserted row back

        if (error) {
            console.error('Error adding folder:', error);
            return;
        }

        // Update state 
        setFolders([...folders, data[0]]);
    };

    const UpdateFolderName = async (id, value) => {
        // handle database
        const { error } = await supabase
            .from('folders')
            .update({ "name": value })
            .eq("id", id);
        if (error) console.error('Error updating folder:,error');

        // handle state
        const newFolders = folders.map(f => f.id === id ? { ...f, name: value } : f);
        setFolders(newFolders);
    }

    // Delete a folder
    const deleteFolder = async (folderId) => {
        // Remove from state
        const newFolders = folders.filter(f => f.id !== folderId);
        setFolders(newFolders);

        // Move entries from deleted folder to empty folder
        const updatedEntries = entries.map(e =>
            e.folder === folderId ? { ...e, folder: null } : e
        );

        const { ferror } = await supabase
            .from('entries')
            .update({ folder_id: null })
            .eq('folder_id', folderId);

        if (ferror) console.error('Error setting entry folder to null:', error);

        setEntries(updatedEntries);

        // Delete folder in Supabase
        const { error } = await supabase.from('folders').delete().eq('id', folderId);
        if (error) console.error('Error deleting folder:', error);
    };


    useEffect(() => {
        console.log(userId);
        if(userId == null) return;
        const fetchData = async () => {
            // Fetch folders
            const { data: foldersData, error: foldersError } = await supabase
                .from('folders')
                .select('*')
                .eq('user_id', userId);
            if (foldersError) console.error(foldersError);
            else setFolders(foldersData);

        }
        fetchData();
    }, [userId]);

    return (
        <FoldersContext.Provider value={{
            folders, setFolders,
            activeFolder, setActiveFolder,
            editFolder, setEditFolder,
            newFolderName, setNewFolderName,
            showFolders, setShowFolders,
            openEditFolder, setOpenEditFolder,
            editableFolder, setEditableFolder,
            addFolder,
            UpdateFolderName, deleteFolder,
        }}>
            {children}
        </FoldersContext.Provider>
    );
}

export function useFolders() {
    return useContext(FoldersContext);
}


