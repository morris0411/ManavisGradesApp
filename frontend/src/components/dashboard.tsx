"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { CommonTestTab } from "./common-test-tab"
import { DescriptiveTestTab } from "./descriptive-test-tab"
import { UniversityTestTab } from "./university-test-tab"
import { High1High2TestTab } from "./high1-high2-test-tab"

type DashboardProps = {
  exams?: Array<any>
}

export function PerformanceDashboard(props: DashboardProps) {
  const { exams } = props
  const [activeTab, setActiveTab] = useState("common-test")

  return (
    <div className="w-full">
      {/* Title Section */}
      <div className="mb-8" style={{ borderColor: "#e5eef3" }}>
        <h2 
          className="text-3xl font-bold" 
          style={{ 
            background: "linear-gradient(135deg, #1BA4C3 0%, #0086A9 50%, #006580 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}
        >
          成績ダッシュボード
        </h2>
      </div>

      {/* Tabs Section */}
      <div 
        className="rounded-lg p-6 mb-6" 
        style={{ 
          backgroundColor: "#ffffff", 
          boxShadow: "0 1px 3px rgba(0, 101, 128, 0.08)" 
        }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList 
            className="grid w-full max-w-2xl grid-cols-4"
            style={{ 
              backgroundColor: "#f0f5f9",
              border: "1px solid #e5eef3"
            }}
          >
            <TabsTrigger 
              value="common-test"
              style={{
                color: activeTab === "common-test" ? "#006580" : "#666e7e"
              }}
            >
              共テ
            </TabsTrigger>
            <TabsTrigger 
              value="descriptive"
              style={{
                color: activeTab === "descriptive" ? "#006580" : "#666e7e"
              }}
            >
              記述
            </TabsTrigger>
            <TabsTrigger 
              value="high1-high2"
              style={{
                color: activeTab === "high1-high2" ? "#006580" : "#666e7e"
              }}
            >
              高1/高2
            </TabsTrigger>
            <TabsTrigger 
              value="university"
              style={{
                color: activeTab === "university" ? "#006580" : "#666e7e"
              }}
            >
              オープン
            </TabsTrigger>
          </TabsList>

          <TabsContent value="common-test" className="space-y-6 mt-6">
            <CommonTestTab exams={exams} />
          </TabsContent>

          <TabsContent value="descriptive" className="space-y-6 mt-6">
            <DescriptiveTestTab exams={exams} />
          </TabsContent>

          <TabsContent value="high1-high2" className="space-y-6 mt-6">
            <High1High2TestTab exams={exams} />
          </TabsContent>

          <TabsContent value="university" className="space-y-6 mt-6">
            <UniversityTestTab exams={exams} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
