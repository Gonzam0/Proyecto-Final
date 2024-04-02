export interface Task{
    id: string
    title: string
    description: string,
    items: Item[]
}

export interface Item{
    name: string,
    completed: boolean
}