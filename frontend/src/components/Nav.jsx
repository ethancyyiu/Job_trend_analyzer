import React from 'react'

export function Nav({page, setPage}){
  const items = [
    {key:'Home', label:'Home'},
    {key:'Dashboard', label:'Dashboard'},
    {key:'SkillsView', label:'Skills'},
    {key:'Postings', label:'Postings'},
    {key:'Salary', label:'Salary'},
  ]

  return (
    <div className="nav-vertical">
      {items.map(item => (
        <button
          key={item.key}
          className={"nav-item " + (page===item.key? 'active' : '')}
          onClick={() => setPage(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export default Nav
