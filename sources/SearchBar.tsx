import {useRef, useState} from 'react';
import {useEditable}      from 'use-editable';

export function SearchBar() {
  const [search, setSearch] = useState<string>(``);

  const editorRef = useRef(null);
  useEditable(editorRef, setSearch);

  return (
    <div ref={editorRef} tabIndex={-1}>
      {search}
    </div>
  );
}
