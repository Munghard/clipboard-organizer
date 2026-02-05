import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import { ClipboardProvider } from './ClipBoardContext.jsx';
import { FoldersProvider } from './FoldersContext.jsx';
import { TagsProvider } from './TagsContext.jsx';
import { UserProvider } from './UserContext.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <ClipboardProvider>
          <FoldersProvider>
            <TagsProvider>
              <App />
            </TagsProvider>
          </FoldersProvider>
        </ClipboardProvider>
      </UserProvider>
    </QueryClientProvider>
  </StrictMode>,
)
