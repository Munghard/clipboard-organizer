import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import { ClipboardProvider } from './ClipBoardContext.jsx';
import { FoldersProvider } from './FoldersContext.jsx';
import { TagsProvider } from './TagsContext.jsx';
import { UserProvider } from './UserContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>
      <ClipboardProvider>
        <FoldersProvider>
          <TagsProvider>
            <App />
          </TagsProvider>
        </FoldersProvider>
      </ClipboardProvider>
    </UserProvider>
  </StrictMode>,
)
