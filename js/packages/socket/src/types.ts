import {type WaitOptions} from './socket'

type UnionToIntersection<TUnion> = (TUnion extends any ? (arg: TUnion) => any : never) extends (arg: infer TItem) => any
  ? TItem
  : never

export type Listener<
  TTarget extends {[TKey: PropertyKey]: (...args: any) => any},
  TName extends string & keyof TTarget = string & keyof TTarget,
> = UnionToIntersection<
  TName extends string
    ? {
        wait(name: TName, options?: WaitOptions): PromiseLike<void>
        wait<TResult extends ReturnType<TTarget[TName]>>(
          name: TName,
          handler: (payload: Parameters<TTarget[TName]>[0]) => TResult | Promise<Awaited<TResult>>,
          options?: WaitOptions,
        ): PromiseLike<TResult>
        on(name: TName, handler: (payload: Parameters<TTarget[TName]>[0]) => void): () => void
        once(name: TName, handler: (payload: Parameters<TTarget[TName]>[0]) => void): () => void
        off(name: TName, handler: (payload: Parameters<TTarget[TName]>[0]) => void): void
      }
    : never
>

export type Emitter<
  TTarget extends {[TKey: PropertyKey]: (...args: any) => any},
  TName extends string & keyof TTarget = string & keyof TTarget,
> = UnionToIntersection<
  TName extends string
    ? {
        emit(name: TName, payload: Parameters<TTarget[TName]>[0]): () => void
      }
    : never
>

export type Client<
  TTarget extends {[TKey: PropertyKey]: (...args: any) => any},
  TName extends string & keyof TTarget = string & keyof TTarget,
> = UnionToIntersection<
  TName extends string
    ? {
        request(name: TName, payload: Parameters<TTarget[TName]>[0]): Promise<Awaited<ReturnType<TTarget[TName]>>>
      }
    : never
>

export type Server<
  TTarget extends {[TKey: PropertyKey]: (...args: any) => any},
  TName extends string & keyof TTarget = string & keyof TTarget,
> = UnionToIntersection<
  TName extends string
    ? {
        command(
          name: TName,
          handler: (payload: Parameters<TTarget[TName]>[0]) => ReturnType<TTarget[TName]>,
        ): () => void
      }
    : never
>
