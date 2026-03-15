import Header from "@/app/components/Header";
import { Button } from "@/components/ui/button";
import { DataTable } from "../components/DataTable";
import { columns } from "./column";
import { getYarnAccessoriesTable, getYarnAccessoryCategories } from "../_actions/yarn-accessories";
import Link from "next/link";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function AdminYarnAccessories(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams
  const data = await getYarnAccessoriesTable(searchParams)
  const categories = await getYarnAccessoryCategories()

  return (
    <>
      <div className="mx-5 lg:mx-5 my-3">
        <div className="flex justify-between gap-4 items-center">
          <Header>Yarn Accessories</Header>
          <Button asChild>
            <Link href="/admin/yarn-accessories/new">Add</Link>
          </Button>
        </div>
        <div className="lg:my-5 my-4 min-w-full">
          <DataTable 
            columns={columns} 
            data={data} 
            categories={categories}
          />
        </div>
      </div>
    </>
  )
}
