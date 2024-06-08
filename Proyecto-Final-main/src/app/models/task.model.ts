export interface Task{
    id: string
    title: string
    description: string,
    items: Item[],
    date: string,
    active: boolean,
    type: string,
    group: string,
    userEmail: string,
    userName: string,
    userId: string
}

export interface Item{
    name: string,
    completed: boolean
}
