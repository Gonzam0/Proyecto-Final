export interface Task{
    id: string
    title: string
    description: string,
    items: Item[],
    date: string,
    active: boolean,
    tipo: string
}

export interface Item{
    name: string,
    completed: boolean
}