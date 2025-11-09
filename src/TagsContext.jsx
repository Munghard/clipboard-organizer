import { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { UserContext } from "./UserContext";

export const TagsContext = createContext();

export function TagsProvider({ children }) {
    // TAGS
    const [tags, setTags] = useState([]);
    const [activeTag, setActiveTag] = useState('');
    const [editTags, setEditTags] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [showTags, setShowTags] = useState(false);
    const [openEditTag, setOpenEditTag] = useState(false);
    const [editableTag, setEditableTag] = useState(null);

    const {userId} = useContext(UserContext);
    // Add a tag
    const AddTag = async (t) => {
        // Fetch existing tags for this user
        const { data: stored, error } = await supabase
            .from('tags')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching tags:', error);
            return;
        }

        // Check if tag already exists (case-insensitive)
        if (stored.some(tag => tag.name.toLowerCase() === t.toLowerCase())) return;

        // Insert new tag into Supabase
        const { data: newTag, error: insertError } = await supabase
            .from('tags')
            .insert([{ name: t, user_id: userId }])
            .select(); // returns inserted row

        if (insertError) {
            console.error('Error inserting tag:', insertError);
            return;
        }

        // Update local state and localStorage
        const updated = [...stored, ...newTag];
        setTags(updated);
    };
    // Update tag name
    const UpdateTagName = async (id, value) => {
        // handle database
        const { error } = await supabase
            .from('tags')
            .update({ "name": value })
            .eq("id", id);
        if (error) console.error('Error updating tag:,error');

        // handle state
        const newTags = tags.map(f => f.id === id ? { ...f, name: value } : f);
        setTags(newTags);
    }
    // Remove a tag by index
    const RemoveTag = async (id) => {
        // Delete all entry_tags that reference this tag
        await supabase.from('entry_tags').delete().eq('tag_id', id);

        // Delete tag from Supabase
        const { data, error } = await supabase
            .from('tags')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting tag:', error);
            return;
        }

        // Remove tag from local state
        const updated = tags.filter(tag => tag.id !== id);
        setTags(updated);

    };

    useEffect(() => {
        if(userId == null) return;
        const fetchData = async () => {
            // Fetch tags
            const { data: tagsData, error: tagsError } = await supabase
                .from('tags')
                .select('*')
                .eq('user_id', userId);
            if (tagsError) console.error(tagsError);
            else {
                setTags(tagsData);
            }

        }
        fetchData();
    }, [userId]);


    return (
        <TagsContext.Provider value={{
            tags, setTags,
            activeTag, setActiveTag,
            editTags, setEditTags,
            newTagName, setNewTagName,
            showTags, setShowTags,
            openEditTag, setOpenEditTag,
            editableTag, setEditableTag,
            AddTag, UpdateTagName,
            RemoveTag
        }}>
            {children}
        </TagsContext.Provider>
    );
}

export function useTags() {
    return useContext(TagsContext);
}
