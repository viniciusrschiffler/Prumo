export type BatchStatement = {
  query: string
  values?: readonly unknown[]
}

export type SqlGateway = {
  select<TRows>(query: string, values?: readonly unknown[]): Promise<TRows>
  executeBatch(statements: readonly BatchStatement[]): Promise<number>
}
